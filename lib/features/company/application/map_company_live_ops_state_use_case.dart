enum CompanyLiveStateTone {
  online,
  stale,
}

enum CompanyLiveSourceMode {
  rtdb,
  tripDoc,
}

enum CompanyRtdbStreamState {
  live,
  mismatch,
  error,
  accessDenied,
}

class CompanyLiveStateMappingResult {
  const CompanyLiveStateMappingResult({
    required this.tone,
    required this.sourceMode,
  });

  final CompanyLiveStateTone tone;
  final CompanyLiveSourceMode sourceMode;
}

class MapCompanyLiveOpsStateUseCase {
  const MapCompanyLiveOpsStateUseCase();

  CompanyLiveStateMappingResult mapTrip({
    required String liveState,
    required String liveSource,
  }) {
    final normalizedState = liveState.trim().toLowerCase();
    final normalizedSource = liveSource.trim().toLowerCase();
    return CompanyLiveStateMappingResult(
      tone: normalizedState == 'online'
          ? CompanyLiveStateTone.online
          : CompanyLiveStateTone.stale,
      sourceMode: normalizedSource == 'rtdb'
          ? CompanyLiveSourceMode.rtdb
          : CompanyLiveSourceMode.tripDoc,
    );
  }

  CompanyRtdbStreamState mapRtdbStreamState({
    required bool hasSnapshot,
    required bool hasTripMismatch,
    required bool hasError,
    required bool isAccessDenied,
  }) {
    if (isAccessDenied) {
      return CompanyRtdbStreamState.accessDenied;
    }
    if (hasError) {
      return CompanyRtdbStreamState.error;
    }
    if (hasTripMismatch) {
      return CompanyRtdbStreamState.mismatch;
    }
    if (hasSnapshot) {
      return CompanyRtdbStreamState.live;
    }
    return CompanyRtdbStreamState.error;
  }
}
