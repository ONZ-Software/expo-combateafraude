package [[PACKAGE]];

import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.content.Context;

import org.jetbrains.annotations.NotNull;

import com.caf.facelivenessiproov.input.FaceLiveness;
import com.caf.facelivenessiproov.input.VerifyLivenessListener;
import com.caf.facelivenessiproov.output.FaceLivenessResult;

public class CafModule extends ReactContextBaseJavaModule {
    private Context context;

    public CafModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
    }

    @NotNull
    @Override
    public String getName() {
        return "CafModule";
    }

    @ReactMethod
    public void startFaceLiveness(String mobileToken, String personId) {

        FaceLiveness faceLiveness = new FaceLiveness.Builder(mobileToken)
                .setFilter(Filter.NATURAL)
                .build();

        faceLiveness.startSDK(this.context, personId, new VerifyLivenessListener() {
            @Override
            public void onSuccess(FaceLivenessResult faceLivenessResult) {
                getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onFaceLivenessSuccess", faceLivenessResult.getSignedResponse());
            }

            @Override
            public void onError(FaceLivenessResult faceLivenessResult) {
                getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onFaceLivenessError", faceLivenessResult.getErrorMessage());
            }

            @Override
            public void onCancel(FaceLivenessResult faceLivenessResult) {
                getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onFaceLivenessCancel", faceLivenessResult.getErrorMessage());
            }

            @Override
            public void onLoading() {
                getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onFaceLivenessLoading", true);
            }

            @Override
            public void onLoaded() {
                getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onFaceLivenessLoaded", true);
            }
        });
    }
}
