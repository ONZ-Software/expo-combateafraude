package [[PACKAGE]];

import android.content.Intent;
import android.os.Bundle;

import com.caf.facelivenessiproov.input.FaceLiveness;
import com.caf.facelivenessiproov.input.VerifyLivenessListener;
import com.caf.facelivenessiproov.output.FaceLivenessResult;
import com.caf.facelivenessiproov.output.failure.SDKFailure;
import com.caf.facelivenessiproov.output.failure.ErrorType;
import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONException;


public class CafFaceLivenessActivity extends ReactActivity {
    private String token;
    private String personId;
    private String customConfig;
    private Intent intent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        intent = getIntent();
        token = intent.getStringExtra("token");
        personId = intent.getStringExtra("personId");
        customConfig = intent.getStringExtra("config");

        try {
            this.faceLiveness();
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    private void faceLiveness() throws JSONException {
        FaceLivenessConfig config = new FaceLivenessConfig(customConfig);

        FaceLiveness faceLiveness = new FaceLiveness.Builder(token)
                .setStage(config.cafStage)
                .setFilter(config.filter)
                .setEnableScreenshots(config.setEnableScreenshots)
                .setLoadingScreen(config.setLoadingScreen)
                .build();

        faceLiveness.startSDK(this, personId, new VerifyLivenessListener() {
            @Override
            public void onSuccess(FaceLivenessResult faceLivenessResult) {
                WritableMap writableMap = new WritableNativeMap();
                writableMap.putString("data", faceLivenessResult.getSignedResponse());

                getReactInstanceManager().getCurrentReactContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("FaceLiveness_Success", writableMap);
                finish();
            }

            @Override
            public void onError(SDKFailure sdkFailure) {
                String message = "Error: " + sdkFailure.getDescription();
                String type = "Error";
                WritableMap writableMap = new WritableNativeMap();

                ErrorType errorType = sdkFailure.getErrorType();
                switch (errorType) {
                    case NETWORK_EXCEPTION:
                        message = "Network error occurred.";
                        break;
                    case SERVER_EXCEPTION:
                        message = "Server error occurred.";
                        break;
                    case CAMERA_PERMISSION:
                        message = "Camera permission not granted.";
                        break;
                    case TOKEN_EXCEPTION:
                        message = "Invalid or expired token.";
                        break;
                    case UNSUPPORTED_DEVICE:
                        message = "Unsupported device.";
                        break;
                    case CERTIFICATE_EXCEPTION:
                        message = "Certificate pinning error.";
                        break;
                    default:
                        message = "Unknown error occurred.";
                        break;
                }

                writableMap.putString("message", message);
                writableMap.putString("type", type);

                getReactInstanceManager().getCurrentReactContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("FaceLiveness_Error", writableMap);
                finish();
            }

            @Override
            public void onCancel() {
                WritableMap writableMap = new WritableNativeMap();
                getReactInstanceManager().getCurrentReactContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("FaceLiveness_Cancel", writableMap);
                finish();
            }

            @Override
            public void onLoading() {
                WritableMap writableMap = new WritableNativeMap();

                getReactInstanceManager().getCurrentReactContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("FaceLiveness_Loading", writableMap);
            }

            @Override
            public void onLoaded() {
                WritableMap writableMap = new WritableNativeMap();

                getReactInstanceManager().getCurrentReactContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("FaceLiveness_Loaded", writableMap);
            }

        });
    }
}
