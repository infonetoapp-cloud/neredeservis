import 'package:flutter/material.dart';

import '../../tokens/spacing_tokens.dart';

class AmberScreenScaffold extends StatelessWidget {
  const AmberScreenScaffold({
    super.key,
    required this.title,
    required this.body,
    this.subtitle,
    this.actions,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.scrollable = false,
    this.safeAreaBottom = true,
    this.padding = AmberSpacingTokens.screenPadding,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final List<Widget>? actions;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final bool scrollable;
  final bool safeAreaBottom;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    Widget content = Padding(
      padding: padding,
      child: body,
    );

    if (scrollable) {
      content = SingleChildScrollView(
        child: content,
      );
    }

    content = SafeArea(
      bottom: safeAreaBottom,
      child: content,
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(title),
            if (subtitle != null)
              Text(
                subtitle!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
        actions: actions,
      ),
      body: content,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}
