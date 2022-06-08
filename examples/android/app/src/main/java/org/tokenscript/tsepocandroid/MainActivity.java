package org.tokenscript.tsepocandroid;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;
import android.widget.ImageView;
import android.widget.TextView;

import com.bumptech.glide.Glide;

import org.jetbrains.annotations.NotNull;
import org.tokenscript.engine.*;

import kotlin.Result;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlin.coroutines.CoroutineContext;
import kotlin.coroutines.EmptyCoroutineContext;

public class MainActivity extends AppCompatActivity {

    private TextView dataText;
    private ImageView dataImage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        dataText = findViewById(R.id.data_text);
        dataImage = findViewById(R.id.data_image);

        TSEngine engine = new TSEngine(MainActivity.this);

        // Test callback function version
        engine.getTokenScript("0xd0d0b327f63a523eed41751e6344dc574b874e02", (TSToken tokenApi) -> {

            tokenApi.testHttp((OpenSeaTokenData data) -> {

                Log.w("ANDROID_APP", data.toString());

                runOnUiThread(new UpdateHandler(data.getName(), data.getImageUrl()));

                return null;
            }, (String error) -> {
                Log.e("ANDROID_APP", "Fetch failed: " + error);
                return null;
            });

            return null;

        }, (String error) -> {
            Log.e("ANDROID_APP", "Fetch failed: " + error);
            return null;
        });

        // Test continuation/suspend function version
        // TODO: For some reason this doesn't work when the tokenscript definition is fetched from storage.
        //       No error or exception, the resumeWith function is just never called. Weird, investigate further.
        /*engine.getTokenScript("0xd0d0b327f63a523eed41751e6344dc574b874e02", new Continuation(){

            @Override
            public void resumeWith(@NonNull Object o) {

                if (o instanceof Result.Failure){
                    Result.Failure err = (Result.Failure) o;
                    Log.e("ANDROID_APP", "Fetch failed: " + err.exception.getMessage(), err.exception);
                    return;
                }

                TSToken tokenApi = (TSToken) o;

                Log.w("ANDROID_APP", o.toString());

                tokenApi.testHttp(dataContinuation);
            }

            @NonNull
            @Override
            public CoroutineContext getContext() {
                return EmptyCoroutineContext.INSTANCE;
            }
        });*/
    }

    private final Continuation<OpenSeaTokenData> dataContinuation = new Continuation() {
        @NonNull
        @Override
        public CoroutineContext getContext() {
            return EmptyCoroutineContext.INSTANCE;
        }

        @Override
        public void resumeWith(@NonNull Object o) {

            if (o instanceof Result.Failure){
                Result.Failure err = (Result.Failure) o;
                Log.e("ANDROID_APP", "Fetch failed: " + err.exception.getMessage(), err.exception);
                return;
            }

            OpenSeaTokenData data = (OpenSeaTokenData) o;

            runOnUiThread(new UpdateHandler(data.getName(), data.getImageUrl()));
        }
    };

    private class UpdateHandler implements Runnable {

        private final String name;
        private final String imageUrl;

        public UpdateHandler(String name, String imageUrl){
            this.name = name;
            this.imageUrl = imageUrl;
        }

        @Override
        public void run() {
            Glide.with(MainActivity.this)
                    .load(imageUrl)
                    .into(dataImage);
            dataText.setText(this.name);
        }
    }
}