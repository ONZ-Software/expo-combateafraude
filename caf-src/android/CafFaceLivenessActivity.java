package [[PACKAGE]];

import android.content.Intent;
import android.os.Bundle;

import com.caf.facelivenessiproov.input.FaceLiveness;
import com.caf.facelivenessiproov.input.VerifyLivenessListener;
import com.caf.facelivenessiproov.input.iproov.Filter;
import com.caf.facelivenessiproov.output.FaceLivenessResult;
import com.caf.facelivenessiproov.output.failure.SDKFailure;
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

    FaceLiveness faceLiveness = new FaceLiveness.Builder(token)
      .setFilter(Filter.NATURAL)
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


      public void onError(SDKFailure sdkFailure) {
        String message = "Error: " + sdkFailure.getDescription()
          ;
        String type = "Error: " + sdkFailure.getErrorType();
        WritableMap writableMap = new WritableNativeMap();

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
