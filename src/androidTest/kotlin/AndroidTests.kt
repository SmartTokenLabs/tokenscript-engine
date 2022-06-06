import kotlinx.coroutines.test.runTest
import org.junit.Test

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.runner.RunWith
import org.tokenscript.engine.TSEngine
import kotlin.test.assertEquals

@RunWith(AndroidJUnit4::class)
class AndroidTests {

    fun getTokenscriptEngine(): TSEngine {

        val context = InstrumentationRegistry.getInstrumentation().context

        return TSEngine(context)
    }

    @Test
    fun testDefinitionStorageReadAndWrite() = runTest {
        val engine = getTokenscriptEngine()
        val testText = "Testing write"

        engine.defStorageProvider.writeDefinition("0x0000", testText)

        val res: String? = engine.defStorageProvider.readDefinition("0x0000")

        assertEquals(res, testText)
    }
}


