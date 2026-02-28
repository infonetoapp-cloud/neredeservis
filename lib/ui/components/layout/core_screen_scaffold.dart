import 'package:flutter/material.dart';

import '../../tokens/core_colors.dart';
import '../../tokens/core_spacing.dart';

class CoreScreenScaffold extends StatelessWidget {
  const CoreScreenScaffold({
    super.key,
    required this.title,
    required this.body,
    this.subtitle,
    this.actions,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.scrollable = false,
    this.safeAreaBottom = true,
    this.padding = CoreSpacing.screenPadding,
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
    final textTheme = Theme.of(context).textTheme;

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
        titleSpacing: CoreSpacing.space20,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: textTheme.titleLarge,
            ),
            if (subtitle != null)
              Text(
                subtitle!,
                style: textTheme.bodySmall?.copyWith(
                  color: CoreColors.ink500,
                ),
              ),
          ],
        ),
        actions: actions,
      ),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[
              CoreColors.surface50,
              CoreColors.surface0,
            ],
          ),
        ),
        child: content,
      ),
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}
