package org.tokenscript.tsepocandroid;

import android.content.Context;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.tokenscript.engine.TSEngine;

import static org.junit.Assert.*;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {
    @Test
    public void useAppContext() {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("org.tokenscript.tsepocandroid", appContext.getPackageName());
    }

    private TSEngine getTokenscriptEngine() {

        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();

        return new TSEngine(context);
    }

    @Test
    public void testDefinitionStorageReadAndWrite() {
        TSEngine engine = getTokenscriptEngine();
        String testText = "Testing write";

        engine.getDefStorageProvider().writeDefinition("0x0000", testText);

        String res = engine.getDefStorageProvider().readDefinition("0x0000");

        assertEquals(res, testText);
    }
}