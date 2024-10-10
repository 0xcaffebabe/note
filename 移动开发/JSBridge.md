# JSBridge

> 混合移动开发中 JS 与宿主通信的一种方式

## 安卓

```java
public class WebAppInterface {
    Context mContext;

    /** Instantiate the interface and set the context */
    WebAppInterface(Context c) {
        mContext = c;
    }

    /** Show a toast from the web page */
    @JavascriptInterface
    public void showToast(String toast) {
        Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
    }
}
// 添加js接口 一个名为Android的全局对象
webview.addJavascriptInterface(new WebAppInterface(this), "Android");
```

宿主调用js:

```js
// 执行一段js脚本 可以获取到脚本的返回参数
webView.evaluateJavascript("alert('hello world')", new ValueCallback<String>() {
    @Override
    public void onReceiveValue(String value) {
    }
});
// 加载url的同时传递参数
webView.loadUrl("schema://url?params");
```

```js
if(typeof Android !== "undefined" && Android !== null) {
    Android.showToast(toast);
} else {
    alert("Not viewing in webview");
}
```

## IOS

```js
// name为唯一标识 postMessage方法会发送一条数据到宿主
function postMessage(name, message) {
    window.webkit.messageHandlers[name].postMessage(message);
}
```

定义一个实现 `WKScriptMessageHandler` 协议的类

```swift
class DocImgBridge: NSObject, WKScriptMessageHandler {
    
    let onImgClick: (String, String) -> ()
    
    init(callback: @escaping (String, String) -> () = {_,_ in ()}) {
        self.onImgClick = callback
    }
    
    // 这个方法在JS postMessage方法被调用后调用 会将message传递过来 在这里做具体的业务处理
    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        debugPrint(body)
        onImgClick(body["src"] as? String ?? "", body["name"] as? String ?? "")
    }
}
```

注册：

```swift
webview.configuration.userContentController.add(bridge, name: bridgeName)
```

宿主调用js:

```swift
webview.evaluateJavaScript("script", completionHandler: <#T##((Any?, Error?) -> Void)?##((Any?, Error?) -> Void)?##(Any?, Error?) -> Void#>)(<#T##javaScriptString: String##String#>)
```