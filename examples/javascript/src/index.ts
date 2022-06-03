import * as tse from "tokenscript-engine";

class TestApp {

    public async init(){
        console.log("App running...");

        let tsEngine = new tse.org.tokenscript.engine.TSEngine();
        console.log(tsEngine);

        // Promise style
        /*let ts = tsEngine.getTokenScriptAsync("0xd0d0b327f63a523eed41751e6344dc574b874e02").then((tokenApi: any) => {

            console.log(tokenApi);

            tokenApi.testHttpAsync().then((data: any) => {

                console.log(data);

                document.getElementById("loading").style.display = "none";
                document.getElementById("display").style.display = "block";

                document.getElementById("title").innerText = data.name;
                document.getElementById("image").setAttribute("src", data.imageUrl);

            }).catch((e: Error) => {
                alert(e);
            });

        }).catch((e: Error) => {
            console.log(e);
        });*/

        // Await style
        try {
            let tokenApi = await tsEngine.getTokenScriptAsync("0xd0d0b327f63a523eed41751e6344dc574b874e02");

            let data = await tokenApi.testHttpAsync();

            console.log(data);

            document.getElementById("loading").style.display = "none";
            document.getElementById("display").style.display = "block";

            document.getElementById("title").innerText = data.name;
            document.getElementById("image").setAttribute("src", data.imageUrl);

        } catch (e: any){
            console.error(e);
        }
    }

}

(new TestApp()).init();
