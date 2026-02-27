part of '../app_router.dart';

List<RouteBase> _buildPublicEntryRoutes(_AppRouterRouteDeps deps) {
  return <RouteBase>[
    GoRoute(
      path: AppRoutePath.auth,
      builder: (context, state) {
        final query = _AuthEntryRouteQuery.fromState(state);
        final nextRole = query.nextRole;
        return EmailAuthScreen(
          appName: deps.flavorConfig.appName,
          continueHint: _resolveAuthContinueHint(nextRole),
          mode: EmailAuthMode.signIn,
          onSubmit: (input) => _handleEmailSignIn(
            context,
            input: _EmailSignInInput(
              email: input.email,
              password: input.password,
            ),
            nextRole: nextRole,
          ),
          onSwitchModeTap: () => context.go(
            _buildEmailAuthRoute(
              mode: _authEmailModeRegister,
              nextRole: nextRole,
            ),
          ),
          onForgotPasswordTap: () => context.go(
            _buildEmailAuthRoute(
              mode: _authEmailModeForgot,
              nextRole: nextRole,
            ),
          ),
          onGoogleSignInTap: () => _handleGoogleSignIn(
            context,
            nextRole: nextRole,
            environment: deps.environment,
          ),
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.authEmail,
      builder: (context, state) {
        final query = _AuthEntryRouteQuery.fromState(state);
        final nextRole = query.nextRole;
        final mode = query.emailMode;
        final isRegister = mode == _authEmailModeRegister;
        final isForgot = mode == _authEmailModeForgot;
        return EmailAuthScreen(
          appName: deps.flavorConfig.appName,
          continueHint: _resolveAuthContinueHint(nextRole),
          mode: isRegister
              ? EmailAuthMode.register
              : isForgot
                  ? EmailAuthMode.forgotPassword
                  : EmailAuthMode.signIn,
          onBackTap: () {
            final navigator = Navigator.of(context);
            if (navigator.canPop()) {
              navigator.pop();
              return;
            }
            context.go(_buildAuthRoute(nextRole: nextRole));
          },
          onSwitchModeTap: () => context.go(
            _buildEmailAuthRoute(
              mode: (isRegister || isForgot)
                  ? _authEmailModeSignIn
                  : _authEmailModeRegister,
              nextRole: nextRole,
            ),
          ),
          onForgotPasswordTap: isRegister || isForgot
              ? null
              : () => context.go(
                    _buildEmailAuthRoute(
                      mode: _authEmailModeForgot,
                      nextRole: nextRole,
                    ),
                  ),
          onGoogleSignInTap: isRegister || isForgot
              ? null
              : () => _handleGoogleSignIn(
                    context,
                    nextRole: nextRole,
                    environment: deps.environment,
                  ),
          onSubmit: (input) {
            if (isRegister) {
              return _handleEmailRegister(
                context,
                input: _EmailRegisterInput(
                  email: input.email,
                  password: input.password,
                  displayName: input.displayName,
                ),
                nextRole: nextRole,
              );
            }
            if (isForgot) {
              return _handleForgotPassword(
                context,
                email: input.email,
                nextRole: nextRole,
              );
            }
            return _handleEmailSignIn(
              context,
              input: _EmailSignInInput(
                email: input.email,
                password: input.password,
              ),
              nextRole: nextRole,
            );
          },
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.splash,
      builder: (context, state) {
        final query = _AuthEntryRouteQuery.fromState(state);
        final nextRole = query.nextRole;
        return EmailAuthScreen(
          appName: deps.flavorConfig.appName,
          continueHint: _resolveAuthContinueHint(nextRole),
          mode: EmailAuthMode.signIn,
          onSubmit: (input) => _handleEmailSignIn(
            context,
            input: _EmailSignInInput(
              email: input.email,
              password: input.password,
            ),
            nextRole: nextRole,
          ),
          onSwitchModeTap: () => context.go(
            _buildEmailAuthRoute(
              mode: _authEmailModeRegister,
              nextRole: nextRole,
            ),
          ),
          onForgotPasswordTap: () => context.go(
            _buildEmailAuthRoute(
              mode: _authEmailModeForgot,
              nextRole: nextRole,
            ),
          ),
          onGoogleSignInTap: () => _handleGoogleSignIn(
            context,
            nextRole: nextRole,
            environment: deps.environment,
          ),
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.roleSelect,
      builder: (context, state) => RouterDoubleBackExitGuard(
        onBackBlocked: _showDoubleBackExitHint,
        child: RoleSelectScreen(
          appName: deps.flavorConfig.appName,
          onDriverTap: () => _handleContinueAsDriver(context),
          onPassengerTap: () => _handleContinueAsPassenger(context),
          onGuestTap: () => _handleContinueAsGuest(context),
        ),
      ),
    ),
  ];
}

List<RouteBase> _buildPublicJoinRoutes(_AppRouterRouteDeps _) {
  return <RouteBase>[
    GoRoute(
      path: AppRoutePath.join,
      builder: (context, state) {
        final query = _JoinRouteQuery.fromState(state);
        final selectedRole = query.selectedRole;
        return RouterDoubleBackExitGuard(
          onBackBlocked: _showDoubleBackExitHint,
          child: JoinScreen(
            selectedRole: selectedRole,
            authCtaLabel: _buildJoinAuthCtaLabel(selectedRole),
            showAuthCta: selectedRole == JoinRole.passenger,
            onAuthTap: () => _handleJoinAuthTap(context, selectedRole),
            onRoleChangeTap: () =>
                context.push(_buildRoleSelectRoute(manual: true)),
            onJoinByCode: (input) {
              if (selectedRole == JoinRole.guest) {
                return _handleCreateGuestSession(context, input);
              }
              return _handleJoinBySrvCode(context, input);
            },
            onScanQrTap: () {
              unawaited(
                _handleQrScanTap(context, selectedRole: selectedRole),
              );
            },
            onContinueDriverTap: () {
              unawaited(_handleContinueAsDriver(context));
            },
          ),
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.joinQr,
      builder: (context, state) {
        final query = _JoinRouteQuery.fromState(state);
        final selectedRole = query.selectedRole;
        return JoinQrScannerScreen(
          onBackTap: () {
            final navigator = Navigator.of(context);
            if (navigator.canPop()) {
              navigator.pop();
              return;
            }
            context.go(_buildJoinRoute(role: selectedRole));
          },
          onManualCodeTap: () =>
              context.go(_buildJoinRoute(role: selectedRole)),
          onCodeDetected: (rawPayload) => _handleJoinViaQr(
            context,
            selectedRole: selectedRole,
            rawPayload: rawPayload,
          ),
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.joinSuccess,
      builder: (context, state) {
        final query = _JoinSuccessRouteQuery.fromState(state);
        final selectedRole = query.selectedRole;
        final nextPath = query.nextPath ?? _buildJoinRoute(role: selectedRole);
        final isGuest = selectedRole == JoinRole.guest;
        return JoinSuccessScreen(
          title: isGuest ? 'Takip Haz?r' : 'Kat?l?m Ba?ar?l?',
          description: isGuest
              ? 'Misafir takip oturumu olu?turuldu. Servisi canl? izleyebilirsin.'
              : 'Servise kat?l?m tamamland?. Takip ekran?na ge?erek canl? konumu izleyebilirsin.',
          primaryCtaLabel: 'Takibi G?r?nt?le',
          onBackTap: () => context.go(_buildJoinRoute(role: selectedRole)),
          onPrimaryTap: () => context.go(nextPath),
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.joinError,
      builder: (context, state) {
        final query = _JoinErrorRouteQuery.fromState(state);
        final selectedRole = query.selectedRole;
        final reason = query.reason;
        final content = _resolveJoinErrorContent(reason);
        return JoinErrorScreen(
          title: content.title,
          description: content.description,
          primaryCtaLabel: content.primaryCtaLabel,
          secondaryCtaLabel: content.secondaryCtaLabel,
          onBackTap: () => context.go(_buildJoinRoute(role: selectedRole)),
          onPrimaryTap: () {
            unawaited(
              _handleJoinErrorPrimaryTap(
                context,
                selectedRole: selectedRole,
                reason: reason,
              ),
            );
          },
          onSecondaryTap: () => context.go(_buildJoinRoute(role: selectedRole)),
        );
      },
    ),
  ];
}
