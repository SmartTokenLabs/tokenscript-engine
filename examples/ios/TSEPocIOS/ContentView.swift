//
//  ContentView.swift
//  TSEPocIOS
//
//  Created by Michael on 16/4/2022.
//

import SwiftUI
import library
import OSLog;
import SDWebImageSwiftUI

class ViewModel: ObservableObject {
    
    @Published var text: String = "Loading data..."
    @Published var image: String? = nil;
    
    init(){
        /*org.tokenscript.engine.TestHttp.shared.getJsonData() { result, error in
            if (error != nil){
                print(error!);
                return;
            }
            
            print(result!);
        };*/
        
        loadTokenScriptData();
    }
    
    func loadTokenScriptData(){
        
        
        let tokenApi: TSTokenApi? = TSTokenManagementApi.shared.getTokenScript(tsId: "0xf19c56362cfdf66f7080e4a58bf199064e57e07c.1");
                
        if (tokenApi == nil){
            return;
        }
        
        tokenApi?.testHttpJsonObject(onSuccess: {(data: org.tokenscript.engine.OpenSeaTokenData) -> Void in
            
            print(data);
            
            let name = data.name;
            let imageUrl = data.imageUrl;
            
            DispatchQueue.main.async {
                self.text = name;
                self.image = imageUrl;
            }
            
        }, onError: {(error: String) -> Void in
            
            print(error);
        });
    }
    
    func updateData(data: String){
        
        do {
            
            let jsonResult = try JSONDecoder().decode(JSONResult.self, from: data.data(using: .utf8)!);
        
            DispatchQueue.main.async {
                self.text = jsonResult.name;
                self.image = jsonResult.image_url;
            }

        } catch {
            print("Error decoding JSON: \(error)");
        }
    }
}

struct ContentView: View {
    
    @ObservedObject var viewModel = ViewModel()
    
    var body: some View {
        VStack(alignment: .center, spacing: 20){
            if (viewModel.image != nil){
                let url = URL(string: viewModel.image!);
                AnimatedImage(url: url).scaledToFit();
            }
            Text(viewModel.text).padding();
        }
        
    }
}

struct JSONResult: Codable {
    var name: String;
    var image_url: String;
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
