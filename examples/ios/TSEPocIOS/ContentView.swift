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
        
        loadTokenScriptData();
    }
    
    func loadTokenScriptData(){
        
        let engine = TSEngine(basePath: "");
        
        engine.getTokenScript(tsId: "0xd0d0b327f63a523eed41751e6344dc574b874e02") {
            tokenApi, error in
                
                if (error != nil){
                    print(error!);
                    return;
                }
            
            tokenApi?.testHttp(){
                data, error in
                
                    if (error != nil){
                        print(error!);
                        return;
                    }
                
                    print(data!);
                    
                    let name = data!.name;
                    let imageUrl = data!.imageUrl;
                    
                    DispatchQueue.main.async {
                        self.text = name;
                        self.image = imageUrl;
                    }
            }
        }
        
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
