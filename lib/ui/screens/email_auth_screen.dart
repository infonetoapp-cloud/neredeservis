import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../tokens/icon_tokens.dart';

enum EmailAuthMode {
  signIn,
  register,
  forgotPassword,
}

class EmailAuthFormInput {
  const EmailAuthFormInput({
    required this.email,
    required this.password,
    this.displayName,
  });

  final String email;
  final String password;
  final String? displayName;
}

class EmailAuthScreen extends StatefulWidget {
  const EmailAuthScreen({
    super.key,
    required this.appName,
    required this.mode,
    this.continueHint,
    this.onSubmit,
    this.onSwitchModeTap,
    this.onBackTap,
    this.onGoogleSignInTap,
    this.onForgotPasswordTap,
  });

  static const String logoAssetPath = 'assets/images/logo.png';
  static const String googleLogoAssetPath = 'assets/images/google_logo.png';

  final String appName;
  final EmailAuthMode mode;
  final String? continueHint;
  final Future<void> Function(EmailAuthFormInput input)? onSubmit;
  final VoidCallback? onSwitchModeTap;
  final VoidCallback? onBackTap;
  final VoidCallback? onGoogleSignInTap;
  final VoidCallback? onForgotPasswordTap;

  @override
  State<EmailAuthScreen> createState() => _EmailAuthScreenState();
}

class _EmailAuthScreenState extends State<EmailAuthScreen> {
  final TextEditingController _displayNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _submitting = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  String? _formError;

  bool get _isRegisterMode => widget.mode == EmailAuthMode.register;
  bool get _isForgotMode => widget.mode == EmailAuthMode.forgotPassword;
  bool get _isSignInMode => widget.mode == EmailAuthMode.signIn;

  @override
  void dispose() {
    _displayNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final displayName = _displayNameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (!_isValidEmail(email)) {
      _setError('Ge\u00e7erli bir e-posta girin.');
      return;
    }

    if (_isRegisterMode && displayName.length < 2) {
      _setError('Ad soyad en az 2 karakter olmal\u0131.');
      return;
    }

    if (!_isForgotMode && password.length < 6) {
      _setError('\u015eifre en az 6 karakter olmal\u0131.');
      return;
    }

    if (_isRegisterMode && password != confirmPassword) {
      _setError('\u015eifre tekrar alan\u0131 e\u015fle\u015fmiyor.');
      return;
    }

    setState(() {
      _submitting = true;
      _formError = null;
    });

    try {
      await widget.onSubmit?.call(
        EmailAuthFormInput(
          email: email,
          password: _isForgotMode ? '' : password,
          displayName: _isRegisterMode ? displayName : null,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email);
  }

  void _setError(String message) {
    setState(() {
      _formError = message;
    });
  }

  void _clearError() {
    if (_formError == null) {
      return;
    }
    setState(() {
      _formError = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7F5),
      body: SafeArea(
        child: _isSignInMode
            ? _buildFixedSignInBody(context, mediaQuery)
            : _buildScrollableAuthBody(context, mediaQuery),
      ),
    );
  }

  Widget _buildFixedSignInBody(
    BuildContext context,
    MediaQueryData mediaQuery,
  ) {
    final keyboardVisible = mediaQuery.viewInsets.bottom > 0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxHeight < 760;
        final veryCompact = constraints.maxHeight < 700;

        double gap(double regular, double compactValue, double tightValue) {
          if (veryCompact) {
            return tightValue;
          }
          if (compact) {
            return compactValue;
          }
          return regular;
        }

        final content = Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 390),
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                20,
                gap(12, 10, 8),
                20,
                math.max(12, mediaQuery.padding.bottom + 4),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  SizedBox(height: gap(2, 0, 0)),
                  if (!keyboardVisible || !veryCompact) const _AuthLogoBadge(),
                  SizedBox(height: gap(8, 6, 4)),
                  Text(
                    _screenTitle,
                    textAlign: TextAlign.center,
                    style: _AuthTextStyles.title(context),
                  ),
                  SizedBox(height: gap(4, 3, 2)),
                  Text(
                    _screenSubtitle,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: _AuthTextStyles.subtitle(context),
                  ),
                  if (widget.continueHint != null &&
                      widget.continueHint!.trim().isNotEmpty &&
                      !veryCompact) ...<Widget>[
                    SizedBox(height: gap(6, 4, 3)),
                    Text(
                      widget.continueHint!,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: _AuthTextStyles.hint(context),
                    ),
                  ],
                  SizedBox(height: gap(12, 10, 8)),
                  const _InputTitle(text: 'E-posta veya Telefon'),
                  SizedBox(height: gap(4, 3, 2)),
                  _FieldBox(
                    controller: _emailController,
                    enabled: !_submitting,
                    textInputAction: TextInputAction.next,
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: CoreIconTokens.email,
                    onChanged: (_) => _clearError(),
                  ),
                  SizedBox(height: gap(8, 6, 4)),
                  const _InputTitle(text: '\u015eifre'),
                  SizedBox(height: gap(4, 3, 2)),
                  _FieldBox(
                    controller: _passwordController,
                    enabled: !_submitting,
                    textInputAction: TextInputAction.done,
                    keyboardType: TextInputType.visiblePassword,
                    prefixIcon: CoreIconTokens.lock,
                    obscureText: !_showPassword,
                    onChanged: (_) => _clearError(),
                    onSubmitted: (_) => _submit(),
                    suffix: IconButton(
                      onPressed: _submitting
                          ? null
                          : () {
                              setState(() {
                                _showPassword = !_showPassword;
                              });
                            },
                      icon: Icon(
                        _showPassword
                            ? CoreIconTokens.eye
                            : CoreIconTokens.eyeSlash,
                        color: const Color(0xFF8A96A8),
                        size: 20,
                      ),
                    ),
                  ),
                  SizedBox(height: gap(2, 1, 0)),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      key: const Key('email_auth_forgot'),
                      onPressed:
                          _submitting ? null : widget.onForgotPasswordTap,
                      child: Text(
                        '\u015eifremi Unuttum?',
                        style: _AuthTextStyles.link(context),
                      ),
                    ),
                  ),
                  if (_formError != null) ...<Widget>[
                    SizedBox(height: gap(6, 4, 3)),
                    Text(
                      _formError!,
                      style: _AuthTextStyles.error(context),
                    ),
                  ],
                  SizedBox(height: gap(8, 6, 4)),
                  _AuthPrimaryButton(
                    key: const Key('email_auth_submit'),
                    label: _submitButtonLabel,
                    onPressed: _submitting ? null : _submit,
                    isLoading: _submitting,
                  ),
                  SizedBox(height: gap(10, 8, 6)),
                  Row(
                    children: <Widget>[
                      const Expanded(
                        child: Divider(
                          color: Color(0xFFE2E4E1),
                          thickness: 1,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          'Veya',
                          style: _AuthTextStyles.subtitle(context),
                        ),
                      ),
                      const Expanded(
                        child: Divider(
                          color: Color(0xFFE2E4E1),
                          thickness: 1,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: gap(8, 6, 4)),
                  _AuthGoogleButton(
                    key: const Key('email_auth_google'),
                    onPressed: _submitting ? null : widget.onGoogleSignInTap,
                  ),
                  SizedBox(height: gap(6, 4, 3)),
                  Center(
                    child: _ModeSwitchLine(
                      isSignInMode: true,
                      isRegisterMode: false,
                      onTap: _submitting ? null : widget.onSwitchModeTap,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );

        return SingleChildScrollView(
          physics: keyboardVisible
              ? const ClampingScrollPhysics()
              : const NeverScrollableScrollPhysics(),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.only(
            bottom: keyboardVisible ? mediaQuery.viewInsets.bottom : 0,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Align(
              alignment: Alignment.topCenter,
              child: content,
            ),
          ),
        );
      },
    );
  }

  Widget _buildScrollableAuthBody(
    BuildContext context,
    MediaQueryData mediaQuery,
  ) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        math.max(18, mediaQuery.padding.bottom + 8),
      ),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 390),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  onPressed: _submitting ? null : widget.onBackTap,
                  icon: const Icon(
                    CoreIconTokens.back,
                    color: Color(0xFF1B1E1D),
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                _screenTitle,
                textAlign: TextAlign.center,
                style: _AuthTextStyles.title(context),
              ),
              const SizedBox(height: 8),
              Text(
                _screenSubtitle,
                textAlign: TextAlign.center,
                style: _AuthTextStyles.subtitle(context),
              ),
              if (widget.continueHint != null &&
                  widget.continueHint!.trim().isNotEmpty) ...<Widget>[
                const SizedBox(height: 8),
                Text(
                  widget.continueHint!,
                  textAlign: TextAlign.center,
                  style: _AuthTextStyles.hint(context),
                ),
              ],
              const SizedBox(height: 20),
              if (_isRegisterMode) ...<Widget>[
                const _InputTitle(text: 'Ad Soyad'),
                const SizedBox(height: 6),
                _FieldBox(
                  controller: _displayNameController,
                  enabled: !_submitting,
                  textInputAction: TextInputAction.next,
                  keyboardType: TextInputType.name,
                  prefixIcon: CoreIconTokens.user,
                  onChanged: (_) => _clearError(),
                ),
                const SizedBox(height: 10),
              ],
              const _InputTitle(text: 'E-posta'),
              const SizedBox(height: 6),
              _FieldBox(
                controller: _emailController,
                enabled: !_submitting,
                textInputAction:
                    _isForgotMode ? TextInputAction.done : TextInputAction.next,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: CoreIconTokens.email,
                onChanged: (_) => _clearError(),
                onSubmitted: (_) {
                  if (_isForgotMode) {
                    _submit();
                  }
                },
              ),
              if (!_isForgotMode) ...<Widget>[
                const SizedBox(height: 10),
                const _InputTitle(text: '\u015eifre'),
                const SizedBox(height: 6),
                _FieldBox(
                  controller: _passwordController,
                  enabled: !_submitting,
                  textInputAction: _isRegisterMode
                      ? TextInputAction.next
                      : TextInputAction.done,
                  keyboardType: TextInputType.visiblePassword,
                  prefixIcon: CoreIconTokens.lock,
                  obscureText: !_showPassword,
                  onChanged: (_) => _clearError(),
                  onSubmitted: (_) {
                    if (!_isRegisterMode) {
                      _submit();
                    }
                  },
                  suffix: IconButton(
                    onPressed: _submitting
                        ? null
                        : () {
                            setState(() {
                              _showPassword = !_showPassword;
                            });
                          },
                    icon: Icon(
                      _showPassword
                          ? CoreIconTokens.eye
                          : CoreIconTokens.eyeSlash,
                      color: const Color(0xFF8A96A8),
                      size: 20,
                    ),
                  ),
                ),
              ],
              if (_isRegisterMode) ...<Widget>[
                const SizedBox(height: 10),
                const _InputTitle(text: '\u015eifre Tekrar'),
                const SizedBox(height: 6),
                _FieldBox(
                  controller: _confirmPasswordController,
                  enabled: !_submitting,
                  textInputAction: TextInputAction.done,
                  keyboardType: TextInputType.visiblePassword,
                  prefixIcon: CoreIconTokens.lock,
                  obscureText: !_showConfirmPassword,
                  onChanged: (_) => _clearError(),
                  onSubmitted: (_) => _submit(),
                  suffix: IconButton(
                    onPressed: _submitting
                        ? null
                        : () {
                            setState(() {
                              _showConfirmPassword = !_showConfirmPassword;
                            });
                          },
                    icon: Icon(
                      _showConfirmPassword
                          ? CoreIconTokens.eye
                          : CoreIconTokens.eyeSlash,
                      color: const Color(0xFF8A96A8),
                      size: 20,
                    ),
                  ),
                ),
              ],
              if (_formError != null) ...<Widget>[
                const SizedBox(height: 8),
                Text(
                  _formError!,
                  style: _AuthTextStyles.error(context),
                ),
              ],
              const SizedBox(height: 14),
              _AuthPrimaryButton(
                key: const Key('email_auth_submit'),
                label: _submitButtonLabel,
                onPressed: _submitting ? null : _submit,
                isLoading: _submitting,
              ),
              const SizedBox(height: 16),
              Center(
                child: _ModeSwitchLine(
                  isSignInMode: false,
                  isRegisterMode: _isRegisterMode,
                  onTap: _submitting ? null : widget.onSwitchModeTap,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String get _screenTitle {
    if (_isRegisterMode) {
      return 'Kay\u0131t Ol';
    }
    if (_isForgotMode) {
      return '\u015eifremi Unuttum';
    }
    return 'Ho\u015f Geldiniz';
  }

  String get _screenSubtitle {
    if (_isRegisterMode) {
      return 'Yeni hesab\u0131n\u0131 olu\u015ftur.';
    }
    if (_isForgotMode) {
      return 'E-posta adresini gir, s\u0131f\u0131rlama ba\u011flant\u0131s\u0131 g\u00f6nderelim.';
    }
    return 'L\u00fctfen giri\u015f yapmak i\u00e7in bilgilerinizi girin';
  }

  String get _submitButtonLabel {
    if (_isRegisterMode) {
      return 'Kay\u0131t Ol';
    }
    if (_isForgotMode) {
      return 'S\u0131f\u0131rlama Ba\u011flant\u0131s\u0131 G\u00f6nder';
    }
    return 'Giri\u015f Yap';
  }
}

class _AuthLogoBadge extends StatelessWidget {
  const _AuthLogoBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: const Color(0xFF0E0E0E).withAlpha(46),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Image.asset(
        EmailAuthScreen.logoAssetPath,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) {
          return DecoratedBox(
            decoration: BoxDecoration(
              color: const Color(0xFF0F3D3E),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                'Ni',
                style: _AuthTextStyles.logoFallback(context),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _InputTitle extends StatelessWidget {
  const _InputTitle({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: _AuthTextStyles.inputTitle(context),
    );
  }
}

class _FieldBox extends StatelessWidget {
  const _FieldBox({
    required this.controller,
    required this.enabled,
    required this.textInputAction,
    required this.keyboardType,
    required this.prefixIcon,
    this.obscureText = false,
    this.suffix,
    this.onChanged,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final bool enabled;
  final TextInputAction textInputAction;
  final TextInputType keyboardType;
  final IconData prefixIcon;
  final bool obscureText;
  final Widget? suffix;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E4E1)),
      ),
      child: TextField(
        controller: controller,
        enabled: enabled,
        textInputAction: textInputAction,
        keyboardType: keyboardType,
        obscureText: obscureText,
        style: _AuthTextStyles.inputValue(context),
        decoration: InputDecoration(
          prefixIcon: Icon(
            prefixIcon,
            color: const Color(0xFF8A96A8),
            size: 20,
          ),
          suffixIcon: suffix,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
        onChanged: onChanged,
        onSubmitted: onSubmitted,
      ),
    );
  }
}

class _AuthPrimaryButton extends StatelessWidget {
  const _AuthPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    required this.isLoading,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final disabled = onPressed == null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(24),
        child: Ink(
          height: 50,
          decoration: BoxDecoration(
            color: disabled ? const Color(0xFF7A7A7A) : const Color(0xFF0E0E0E),
            borderRadius: BorderRadius.circular(24),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: Colors.black.withAlpha(32),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: <Widget>[
              if (isLoading)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.4,
                    color: Colors.white,
                  ),
                )
              else
                Text(
                  label,
                  style: _AuthTextStyles.primaryButton(context),
                ),
              if (!isLoading)
                const Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: EdgeInsets.only(right: 18),
                    child: Icon(
                      CoreIconTokens.caretRight,
                      size: 16,
                      color: Colors.white,
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

class _AuthGoogleButton extends StatelessWidget {
  const _AuthGoogleButton({
    super.key,
    required this.onPressed,
  });

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E4E1)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Image.asset(
                EmailAuthScreen.googleLogoAssetPath,
                width: 20,
                height: 20,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) {
                  return const SizedBox(
                    width: 20,
                    height: 20,
                    child: Center(
                      child: Text(
                        'G',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1B1E1D),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(width: 10),
              Text(
                'Google ile Giri\u015f',
                style: _AuthTextStyles.googleButton(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModeSwitchLine extends StatelessWidget {
  const _ModeSwitchLine({
    required this.isSignInMode,
    required this.isRegisterMode,
    required this.onTap,
  });

  final bool isSignInMode;
  final bool isRegisterMode;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final lead = isSignInMode
        ? 'Hesab\u0131n\u0131z yok mu?'
        : isRegisterMode
            ? 'Hesab\u0131n\u0131z var m\u0131?'
            : '\u015eifrenizi hat\u0131rlad\u0131n\u0131z m\u0131?';
    final action = isSignInMode ? 'Kay\u0131t Ol' : 'Giri\u015f Yap';

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 4,
      children: <Widget>[
        Text(lead, style: _AuthTextStyles.subtitle(context)),
        TextButton(
          key: const Key('email_auth_switch_mode'),
          onPressed: onTap,
          style: TextButton.styleFrom(
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          ),
          child: Text(action, style: _AuthTextStyles.link(context)),
        ),
      ],
    );
  }
}

class _AuthTextStyles {
  const _AuthTextStyles._();

  static TextStyle title(BuildContext context) {
    return TextStyle(
      fontFamily: _displayFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w700,
      fontSize: 28,
      height: 34 / 28,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle subtitle(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w400,
      fontSize: 15,
      height: 20 / 15,
      color: const Color(0xFF6B6F6D),
    );
  }

  static TextStyle hint(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w500,
      fontSize: 13,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle inputTitle(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w600,
      fontSize: 16,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle inputValue(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w500,
      fontSize: 16,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle primaryButton(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w700,
      fontSize: 17,
      color: Colors.white,
    );
  }

  static TextStyle googleButton(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w600,
      fontSize: 17,
      color: const Color(0xFF1B1E1D),
    );
  }

  static TextStyle link(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w700,
      fontSize: 14,
      color: const Color(0xFF0E0E0E),
    );
  }

  static TextStyle error(BuildContext context) {
    return TextStyle(
      fontFamily: _textFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Manrope', 'sans-serif'],
      fontWeight: FontWeight.w500,
      fontSize: 14,
      color: const Color(0xFFC0352B),
    );
  }

  static TextStyle logoFallback(BuildContext context) {
    return TextStyle(
      fontFamily: _displayFamily(context),
      fontFamilyFallback: const <String>['Inter', 'Space Grotesk'],
      fontWeight: FontWeight.w700,
      fontSize: 22,
      color: const Color(0xFF1B1E1D),
    );
  }

  static String _displayFamily(BuildContext context) {
    if (Theme.of(context).platform == TargetPlatform.iOS) {
      return 'SF Pro Display';
    }
    return 'Inter';
  }

  static String _textFamily(BuildContext context) {
    if (Theme.of(context).platform == TargetPlatform.iOS) {
      return 'SF Pro Text';
    }
    return 'Inter';
  }
}
