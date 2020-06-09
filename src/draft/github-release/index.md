# GitHub Release に asset を追加してみる
<a id="top"></a>

###### CONTENTS

1. [やりたいこと](#purpose)
1. [できたやつ](#outcome)
1. [ベースにしたもの](#base)
1. [まとめ](#postscript)
1. [参考資料](#reference)


###### ENVIRONMENTS

- node: 14.4
- `@actions/github`: 3.0.0


<a id="purpose"></a>
### やりたいこと

CI から GitHub の Release に asset を追加したい。
GitHub Actions からやる方法はいろいろ出てくるが、GitHub Actions ではない CI からやる方法が見つからなかったのでまとめておく。


[TOP](#top)
<a id="outcome"></a>
### できたやつ

node で以下を実行する。

```javascript
const { getOctokit } = require('@actions/github');
const fs = require('fs');
const path = require('path');

(async function run() {
  try {
    const github = getOctokit(process.env.GITHUB_RELEASE_TOKEN);

    const release = await github.repos.createRelease({
      // リリースを作るリポジトリを指定
      owner: "getto-systems",
      repo: "example",
      tag_name: get_tag_name(),
    });

    const assetPath = path.join(__dirname, "build.tar.gz");
    const assetData = fs.readFileSync(assetPath);

    const headers = {
      // asset の content-type を指定
      'content-type': "application/gzip",
    };

    // Release に追加する asset の名前を指定
    const assetName = "asset.tar.gz";
    const uploadURL = `${release.data.upload_url}&name=${assetName}`;

    await github.repos.uploadReleaseAsset({
      url: uploadURL,
      headers,
      data: assetData,
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();

function get_tag_name() {
    return "v0.0.0"; // リリースを作るタグをどうにかして特定
}
```


[TOP](#top)
<a id="base"></a>
### ベースにしたもの

GitHub の Release に asset を追加する方法を調べると、この [GitHub Action](https://github.com/actions/upload-release-asset) が出てきた。
これをベースにして外部の CI から使用できるように調整してみた。

ドキュメントが見つからなかったので、[Developer Guide](https://developer.github.com/v3/repos/releases/) を参考にしつつ、呼び出すメソッドを手探りで探す感じになった。

まず、リリースは `createRelease` で作成しないといけない。
tag をつけただけではリリースにはならないらしい。
さらに、１つの tag につき１つのリリースしか作成できない。

`uploadReleaseAsset` に指定する URL は `createRelease` のレスポンスに含まれる `upload_url` を使用する必要がある。
また、バイナリの場合、asset データは `file` ではなく `data` で指定する必要があった。


[TOP](#top)
<a id="postscript"></a>
### まとめ

リリースに asset をアップロードする方法をまとめた。

API 呼び出しメソッドの定義にたどり着けなかったので、完全に手探りなスクリプトであることに注意。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [actions/upload-release-asset | GitHub](https://github.com/actions/upload-release-asset)
- [actions/toolkit/packages/github | GitHub](https://github.com/actions/toolkit/tree/master/packages/github)
- [Releases | GitHub Developer](https://developer.github.com/v3/repos/releases/)


[TOP](#top)
