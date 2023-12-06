package [[PACKAGE]];
import android.content.Intent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import javax.annotation.Nonnull;

public class CafFaceLiveness extends ReactContextBaseJavaModule {
    private Intent intent;
    @Nonnull
    @Override
    public String getName() {
        return "CafFaceLiveness";
    }

    CafFaceLiveness(ReactApplicationContext reactContext) {
        super(reactContext);
        intent = new Intent(getReactApplicationContext(), CafFaceLivenessActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    @ReactMethod
    public void faceLiveness(String token, String personId, String config) {
        intent.putExtra("token", token);
        intent.putExtra("personId", personId);
        intent.putExtra("config", config);
        getReactApplicationContext().startActivity(intent);
    }
}
