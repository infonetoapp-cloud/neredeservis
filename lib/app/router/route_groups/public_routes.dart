part of '../app_router.dart';

List<RouteBase> _buildPublicEntryRoutes(_AppRouterRouteDeps deps) {
  return <RouteBase>[
    GoRoute(
      path: AppRoutePath.auth,
      builder: (context, state) {
        final nextRole = _resolveAuthNextRole(
          state.uri.queryParameters[_authNextRoleQueryKey],
        );
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
        final nextRole = _resolveAuthNextRole(
          state.uri.queryParameters[_authNextRoleQueryKey],
        );
        final mode = _resolveAuthEmailMode(
          state.uri.queryParameters[_authEmailModeQueryKey],
        );
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
        final nextRole = _resolveAuthNextRole(
          state.uri.queryParameters[_authNextRoleQueryKey],
        );
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
      builder: (context, state) => _DoubleBackExitGuard(
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
        final selectedRoleRaw =
            joinRoleFromQuery(state.uri.queryParameters[_joinRoleQueryKey]);
        final selectedRole = selectedRoleRaw == JoinRole.unknown
            ? JoinRole.passenger
            : selectedRoleRaw;
        return _DoubleBackExitGuard(
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
        final selectedRoleRaw = joinRoleFromQuery(
          state.uri.queryParameters[_joinRoleQueryKey],
        );
        final selectedRole = selectedRoleRaw == JoinRole.unknown
            ? JoinRole.passenger
            : selectedRoleRaw;
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
        final selectedRoleRaw = joinRoleFromQuery(
          state.uri.queryParameters[_joinRoleQueryKey],
        );
        final selectedRole = selectedRoleRaw == JoinRole.unknown
            ? JoinRole.passenger
            : selectedRoleRaw;
        final nextPath =
            _nullableParam(state.uri.queryParameters[_joinNextPathQueryKey]) ??
                _buildJoinRoute(role: selectedRole);
        final isGuest = selectedRole == JoinRole.guest;
        return JoinSuccessScreen(
          title: isGuest ? 'Takip HazÄ±r' : 'KatÄ±lÄ±m BaÅŸarÄ±lÄ±',
          description: isGuest
              ? 'Misafir takip oturumu oluÅŸturuldu. Servisi canlÄ± izleyebilirsin.'
              : 'Servise katÄ±lÄ±m tamamlandi. Takip ekranina gecerek canlÄ± konumu izleyebilirsin.',
          primaryCtaLabel: 'Takibi GÃ¶rÃ¼ntÃ¼le',
          onBackTap: () => context.go(_buildJoinRoute(role: selectedRole)),
          onPrimaryTap: () => context.go(nextPath),
        );
      },
    ),
    GoRoute(
      path: AppRoutePath.joinError,
      builder: (context, state) {
        final selectedRoleRaw = joinRoleFromQuery(
          state.uri.queryParameters[_joinRoleQueryKey],
        );
        final selectedRole = selectedRoleRaw == JoinRole.unknown
            ? JoinRole.passenger
            : selectedRoleRaw;
        final reason = _nullableParam(
                state.uri.queryParameters[_joinErrorReasonQueryKey]) ??
            _joinErrorUnknown;
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
