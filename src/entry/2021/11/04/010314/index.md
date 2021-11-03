# クロスドメインでも worker したい

<a id="top"></a>

###### CONTENTS

1. [クロスドメインで worker は動かない](#worker-not-work-on-cross-domain)
1. [それでもクロスドメインで worker したい](#work-on-cross-domain)
1. [まとめ](#postscript)
1. [参考資料](#reference)

<a id="worker-not-work-on-cross-domain"></a>

### クロスドメインで worker は動かない

[stack overflow](https://stackoverflow.com/questions/23953543/cross-domain-web-workers) の通りクロスドメインで worker は動かない。
[MDN のドキュメント](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)にもそう書いてある。

[TOP](#top)
<a id="work-on-cross-domain"></a>

### それでもクロスドメインで worker したい

でもクロスドメインで worker したい。

[stack overflow](https://stackoverflow.com/questions/23953543/cross-domain-web-workers) に書いてある通り、ソースコードを fetch して blob にして worker を初期化すればいい。

```typescript
const response = await fetch("https://other-domain.example.com/worker.js")
const code = new Blob([await response.text()], { type: "application/javascript" })
new Worker(URL.createObjectURL(code))
```

[TOP](#top)
<a id="postscript"></a>

### まとめ

クロスドメインで worker したかったので調べてみた。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [Cross Domain Web Workers | stack overflow](https://stackoverflow.com/questions/23953543/cross-domain-web-workers)
-   [Using Web Workers | MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

[TOP](#top)
