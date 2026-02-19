package com.neredeservis.app

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import androidx.core.content.ContextCompat
import android.content.Intent

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            BACKGROUND_LOCATION_CHANNEL,
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                START_METHOD -> result.success(startDriverLocationService())
                STOP_METHOD -> result.success(stopDriverLocationService())
                IS_RUNNING_METHOD -> result.success(DriverLocationForegroundService.isRunning)
                else -> result.notImplemented()
            }
        }
    }

    private fun startDriverLocationService(): Boolean {
        val intent = Intent(this, DriverLocationForegroundService::class.java)
        return try {
            ContextCompat.startForegroundService(this, intent)
            true
        } catch (_: Throwable) {
            false
        }
    }

    private fun stopDriverLocationService(): Boolean {
        val intent = Intent(this, DriverLocationForegroundService::class.java)
        return try {
            stopService(intent)
            true
        } catch (_: Throwable) {
            false
        }
    }

    private companion object {
        const val BACKGROUND_LOCATION_CHANNEL =
            "neredeservis/background_location_service"
        const val START_METHOD = "startDriverLocationService"
        const val STOP_METHOD = "stopDriverLocationService"
        const val IS_RUNNING_METHOD = "isDriverLocationServiceRunning"
    }
}
