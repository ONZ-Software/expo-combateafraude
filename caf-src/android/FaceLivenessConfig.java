package [[PACKAGE]];

import com.caf.facelivenessiproov.input.CAFStage;
import com.caf.facelivenessiproov.input.iproov.Filter;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.Serializable;

public class FaceLivenessConfig implements Serializable {
    public CAFStage cafStage;
    public Filter filter;
    public boolean setEnableScreenshots;
    public boolean setLoadingScreen;


    public  FaceLivenessConfig(String jsonString) throws JSONException {
        JSONObject jsonObject = new JSONObject(jsonString);

        this.cafStage = CAFStage.valueOf(jsonObject.getString("cafStage"));
        this.filter = Filter.valueOf(jsonObject.getString("filter"));
        this.setEnableScreenshots = jsonObject.getBoolean("setEnableScreenshots");
        this.setLoadingScreen = jsonObject.getBoolean("setLoadingScreen");
    }
}
