import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../../config/firebase_regions.dart';

class TripChatScreen extends StatefulWidget {
  const TripChatScreen({
    super.key,
    required this.routeId,
    required this.conversationId,
    required this.counterpartName,
    this.counterpartSubtitle,
    this.onBackTap,
  });

  final String routeId;
  final String conversationId;
  final String counterpartName;
  final String? counterpartSubtitle;
  final VoidCallback? onBackTap;

  @override
  State<TripChatScreen> createState() => _TripChatScreenState();
}

class _TripChatScreenState extends State<TripChatScreen> {
  static const List<String> _quickReplies = <String>[
    'Neredesiniz?',
    'Geliyorum',
    'Kapidayim',
    '5 dk',
  ];

  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _messageFocusNode = FocusNode();

  bool _isSending = false;
  String? _currentUid;
  int _lastMessageCount = 0;
  DateTime? _lastReadMarkedAt;

  @override
  void initState() {
    super.initState();
    _currentUid = FirebaseAuth.instance.currentUser?.uid;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_markConversationRead());
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _messageFocusNode.dispose();
    super.dispose();
  }

  Future<void> _sendMessage({String? quickReply}) async {
    final text = (quickReply ?? _messageController.text).trim();
    if (text.isEmpty || _isSending) {
      return;
    }

    setState(() {
      _isSending = true;
    });

    try {
      final callable =
          FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
              .httpsCallable('sendTripMessage');
      await callable.call(<String, dynamic>{
        'routeId': widget.routeId,
        'conversationId': widget.conversationId,
        'text': text,
        'clientMessageId': _buildClientMessageId(),
      });
      if (!mounted) {
        return;
      }
      if (quickReply == null) {
        _messageController.clear();
      }
      _scheduleScrollToBottom(animated: true);
      unawaited(_markConversationRead());
    } on FirebaseFunctionsException catch (_) {
      if (!mounted) {
        return;
      }
      _showSnack('Mesaj gönderilemedi. Lütfen tekrar dene.');
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  String _buildClientMessageId() {
    final now = DateTime.now().toUtc().microsecondsSinceEpoch;
    final uidSuffix = _currentUid == null || _currentUid!.length < 8
        ? 'anon'
        : _currentUid!.substring(0, 8);
    return 'm_${now}_$uidSuffix';
  }

  Future<void> _markConversationRead() async {
    final now = DateTime.now();
    final lastMarkedAt = _lastReadMarkedAt;
    if (lastMarkedAt != null &&
        now.difference(lastMarkedAt) < const Duration(seconds: 2)) {
      return;
    }
    _lastReadMarkedAt = now;

    try {
      final callable =
          FirebaseFunctions.instanceFor(region: firebaseFunctionsRegion)
              .httpsCallable('markTripConversationRead');
      await callable.call(<String, dynamic>{
        'routeId': widget.routeId,
        'conversationId': widget.conversationId,
      });
    } on FirebaseFunctionsException {
      // Read acknowledgment best-effort; no-op on failure.
    }
  }

  void _showSnack(String message) {
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) {
      return;
    }
    messenger.clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _scheduleScrollToBottom({required bool animated}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) {
        return;
      }
      final target = _scrollController.position.maxScrollExtent;
      if (animated) {
        _scrollController.animateTo(
          target,
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
        );
        return;
      }
      _scrollController.jumpTo(target);
    });
  }

  String _formatClockLabel(String? rawIso) {
    if (rawIso == null) {
      return '';
    }
    final parsed = DateTime.tryParse(rawIso);
    if (parsed == null) {
      return '';
    }
    final local = parsed.toLocal();
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final keyboardVisible = MediaQuery.of(context).viewInsets.bottom > 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F5),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            _TripChatHeader(
              name: widget.counterpartName,
              subtitle: widget.counterpartSubtitle,
              onBackTap: widget.onBackTap,
            ),
            Expanded(
              child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                stream: FirebaseFirestore.instance
                    .collection('trip_conversations')
                    .doc(widget.conversationId)
                    .collection('messages')
                    .orderBy('createdAt')
                    .snapshots(),
                builder: (context, snapshot) {
                  final docs = snapshot.data?.docs ?? const [];
                  final messages = docs
                      .map(_TripChatMessage.fromDoc)
                      .where((message) => message.text.isNotEmpty)
                      .toList(growable: false);

                  if (messages.length != _lastMessageCount) {
                    _lastMessageCount = messages.length;
                    _scheduleScrollToBottom(animated: false);
                    unawaited(_markConversationRead());
                  }

                  if (messages.isEmpty) {
                    return const _TripChatEmptyState();
                  }

                  return ListView.separated(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                    itemCount: messages.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final message = messages[index];
                      final isMine = _currentUid != null &&
                          message.senderUid == _currentUid;
                      return Align(
                        alignment: isMine
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.78,
                          ),
                          child: Column(
                            crossAxisAlignment: isMine
                                ? CrossAxisAlignment.end
                                : CrossAxisAlignment.start,
                            children: <Widget>[
                              DecoratedBox(
                                decoration: BoxDecoration(
                                  color: isMine
                                      ? const Color(0xFF0E0E0E)
                                      : const Color(0xFFE7E9E6),
                                  borderRadius: BorderRadius.circular(18),
                                  boxShadow: isMine
                                      ? const <BoxShadow>[
                                          BoxShadow(
                                            color: Color(0x22000000),
                                            blurRadius: 12,
                                            offset: Offset(0, 6),
                                          ),
                                        ]
                                      : const <BoxShadow>[],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 14,
                                    vertical: 11,
                                  ),
                                  child: Text(
                                    message.text,
                                    style: TextStyle(
                                      color: isMine
                                          ? Colors.white
                                          : const Color(0xFF1B1E1D),
                                      fontSize: 17,
                                      height: 1.35,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _formatClockLabel(message.createdAt),
                                style: const TextStyle(
                                  color: Color(0xFF8B918D),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            if (!keyboardVisible)
              _QuickRepliesRow(
                replies: _quickReplies,
                onReplyTap: (text) => _sendMessage(quickReply: text),
              ),
            _ChatComposer(
              controller: _messageController,
              focusNode: _messageFocusNode,
              isSending: _isSending,
              onSendTap: () => _sendMessage(),
              onSubmitted: (_) => _sendMessage(),
            ),
          ],
        ),
      ),
    );
  }
}

class _TripChatHeader extends StatelessWidget {
  const _TripChatHeader({
    required this.name,
    this.subtitle,
    this.onBackTap,
  });

  final String name;
  final String? subtitle;
  final VoidCallback? onBackTap;

  @override
  Widget build(BuildContext context) {
    final normalized = name.trim();
    final initial = normalized.isEmpty ? 'S' : normalized.substring(0, 1);

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
      decoration: const BoxDecoration(
        color: Color(0xFFF6F7F5),
        border: Border(
          bottom: BorderSide(color: Color(0xFFE2E4E1)),
        ),
      ),
      child: Row(
        children: <Widget>[
          IconButton(
            onPressed: onBackTap ?? () => Navigator.of(context).maybePop(),
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            color: const Color(0xFF1B1E1D),
          ),
          const SizedBox(width: 4),
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFE6E8E5),
              border: Border.all(color: const Color(0xFFDADDD8)),
            ),
            alignment: Alignment.center,
            child: Text(
              initial.toUpperCase(),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1B1E1D),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 30,
                    height: 1.05,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF121512),
                  ),
                ),
                if (subtitle != null && subtitle!.trim().isNotEmpty)
                  Text(
                    subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF6B6F6D),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickRepliesRow extends StatelessWidget {
  const _QuickRepliesRow({
    required this.replies,
    required this.onReplyTap,
  });

  final List<String> replies;
  final ValueChanged<String> onReplyTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFF6F7F5),
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: replies
              .map(
                (reply) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    backgroundColor: const Color(0xFFFDFDFD),
                    side: const BorderSide(color: Color(0xFFDCE0DB)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                    label: Text(
                      reply,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1B1E1D),
                      ),
                    ),
                    onPressed: () => onReplyTap(reply),
                  ),
                ),
              )
              .toList(growable: false),
        ),
      ),
    );
  }
}

class _ChatComposer extends StatelessWidget {
  const _ChatComposer({
    required this.controller,
    required this.focusNode,
    required this.isSending,
    required this.onSendTap,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isSending;
  final VoidCallback onSendTap;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.of(context).viewInsets.bottom;

    return AnimatedPadding(
      duration: const Duration(milliseconds: 150),
      curve: Curves.easeOutCubic,
      padding: EdgeInsets.only(bottom: insets),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Color(0xFFE2E4E1)),
          ),
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: <Widget>[
              const _ComposerIconButton(icon: Icons.camera_alt_outlined),
              const SizedBox(width: 8),
              const _ComposerIconButton(icon: Icons.add),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  textInputAction: TextInputAction.send,
                  onSubmitted: onSubmitted,
                  minLines: 1,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Mesajinizi yazin...',
                    hintStyle: const TextStyle(
                      color: Color(0xFF9BA09D),
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF1F3F0),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 13,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Material(
                color: const Color(0xFF0E0E0E),
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: isSending ? null : onSendTap,
                  child: SizedBox(
                    width: 52,
                    height: 52,
                    child: Center(
                      child: isSending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Icon(
                              Icons.send_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ComposerIconButton extends StatelessWidget {
  const _ComposerIconButton({
    required this.icon,
  });

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: const BoxDecoration(
        color: Color(0xFFF1F3F0),
        shape: BoxShape.circle,
      ),
      child: Icon(
        icon,
        size: 22,
        color: const Color(0xFF7D837F),
      ),
    );
  }
}

class _TripChatEmptyState extends StatelessWidget {
  const _TripChatEmptyState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 24),
        child: Text(
          'Mesajlaşma başladı. Hızlı bilgi için kısa bir mesaj gönderebilirsin.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            height: 1.45,
            color: Color(0xFF6B6F6D),
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _TripChatMessage {
  const _TripChatMessage({
    required this.senderUid,
    required this.text,
    required this.createdAt,
  });

  factory _TripChatMessage.fromDoc(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = doc.data();
    final senderUid = (data['senderUid'] as String?)?.trim() ?? '';
    final text = (data['text'] as String?)?.trim() ?? '';
    final createdAt = (data['createdAt'] as String?)?.trim();
    return _TripChatMessage(
      senderUid: senderUid,
      text: text,
      createdAt: createdAt,
    );
  }

  final String senderUid;
  final String text;
  final String? createdAt;
}
