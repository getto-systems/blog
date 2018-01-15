---
title: github-flow 俺式 2018版
---
<a id="top"></a>

###### CONTENTS

1. [git-flow の基本](#git-flow)
1. [origin リポジトリは必ず動くようにしておく](#keep-origin-safe)
1. [master のバージョンが上がったらデプロイ](#deploy-when-version-up)
1. [開発は master から派生させたブランチで行う](#develop-from-master)
1. [各開発者ごとに pub リポジトリをフォーク](#pub-repository)
1. [１プルリクエストにつき１コミット](#pull-request)
1. [大きな変更の場合、 feature ブランチを作成して作業する](#feature-branch)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### SOURCE

- [sanzen-sekai/git-pub : GitHub](https://github.com/sanzen-sekai/git-pub)
- [sanzen-sekai/git-post : GitHub](https://github.com/sanzen-sekai/git-post)
- [getto-systems/git-release-request : GitHub](https://github.com/getto-systems/git-release-request)


<a id="git-flow"></a>
### git-flow の基本

- [GitHub Flow](http://scottchacon.com/2011/08/31/github-flow.html)
- [GitHub Flow 翻訳版](https://gist.github.com/Gab-km/3705015)

基本的なことはここに書いてある。

この中で、現在大切にしているのは以下の点だ。

- origin リポジトリは必ず動くようにしておく
- master のバージョンが上がったらデプロイ
- 開発は master から派生させたブランチで行う


[TOP](#top)
<a id="keep-origin-safe"></a>
### origin リポジトリは必ず動くようにしておく

ここが最重要ポイントだ。
これを守ることで、ここを基点として開発フローを考えることができるようになる。

必ず動くことを保証する方法としては、自動テストやレビューだ。
できれば、各開発者用の開発サーバーにアクセスして動作確認したい。
現状一人で開発しているので、この部分は深く考えられていない。

#### origin リポジトリへのアクセスを限定する

origin リポジトリを必ず動くようにしておくためには、 push できるユーザーを限定しておく必要がある。
できれば、マージ専用のユーザーを作って、そのユーザー以外はマージできないようにしたい。

ただ、現状一人で開発しているのもあって、アクセス制限については深く考えられていない。


[TOP](#top)
<a id="deploy-when-version-up"></a>
### master のバージョンが上がったらデプロイ

origin が必ず動くことで、デプロイスクリプトも単純になる。
動くことが保証されているのだから、そのままデプロイしてしまえば良いのだ。

ただ、デプロイの方法がバージョン番号を使用するものなので、バージョンが上がったらデプロイするようにしている。

現在、 [wercker](http://www.wercker.com/) を利用してデプロイを行なっている。
GitHub や BitBucket と連携して、 master に push されたら特定のステップを実行できるものだ。

各プロジェクトにはバージョン番号を記述しておくファイルが存在する。
`package.json` や `mix.exs` などだ。

このファイルからバージョン番号を取得し、このバージョンがデプロイされているのか、本番サーバーに問い合わせる。
この仕組みは各システムに組み込んでおく必要がある。

バージョンが上がっていたらデプロイを実行する。

`git release-request` コマンドで、各ファイルのバージョンをあげるコミットを作成し、プルリクエストが発行できる。
（[git-release-request](https://github.com/getto-systems/git-release-request) で提供）

#### なぜ常にデプロイしないのか

現在開発しているのは以下の構成となっている。

- Amazon S3 + CloudFront でフロントエンド
- Ruby on Rails でサーバーサイド API

フロントエンド側は、 `/{VERSION}/app.js` というようなパスでデプロイしている為、デプロイを実行する場合は、必ずバージョン番号が上がっている必要がある。

また、サーバーサイド側は特にバージョン番号を気にする必要はないが、将来的にはフロントエンドからアクセスする際にバージョンを固定してアクセスできるようにしたい。

こういう理由で、バージョン番号が上がった時のみ、デプロイを行なっている。


[TOP](#top)
<a id="develop-from-master"></a>
### 開発は master から派生させたブランチで行う

開発は master から派生させたブランチで行う。
これは、マージされていない自分だけのブランチから出発することはしない、ということだ。

常に、検証された master ブランチから開発をスタートさせるのだ。


[TOP](#top)
<a id="pub-repository"></a>
### 各開発者ごとに pub リポジトリをフォーク

開発は origin リポジトリを直接 clone して行う。

push するリポジトリは origin ではなく、各開発者用の pub リポジトリだ。
pub リポジトリは origin をフォークしたもので、 git remote コマンドで `pub` の名前で追加しておく。

なぜ `pub` という名前で追加するかというと、以下のツールを使用する為だ。

- [sanzen-sekai/git-pub : GitHub](https://github.com/sanzen-sekai/git-pub)
- [sanzen-sekai/git-post : GitHub](https://github.com/sanzen-sekai/git-post)
- [getto-systems/git-release-request : GitHub](https://github.com/getto-systems/git-release-request)

これらは、自分用のリポジトリが `pub` という名前で登録されていることを前提としている。
（現在のところ、別な名前を使用することはできない）


[TOP](#top)
<a id="pull-request"></a>
### １プルリクエストにつき１コミット

１プルリクエストに含められる機能追加は１つのみ、という原則を守る。
そして、できれば１コミットにまとめる。

もちろん、巨大な１コミットを作成するという意味ではない。

細かいコミットごとにプルリクエストを作成する、ということだ。

`git create-work-branch` コマンドで、コミットメッセージと共に新しいブランチが作成され、プルリクエストまで発行してくれる。
あとはマージするだけだ。
（[git-post](https://github.com/sanzen-sekai/git-post) で提供）

このやり方だと、ある細かい１機能がマージされるまで、手元の開発を止めなければならなくなる。
なぜなら、開発は master ブランチから派生させる必要があるからだ。
マージされていない独自の機能を前提に開発をスタートさせてはならない。

このやり方は非効率に思えるが、全体的に見れば生産性は上がる。
reject される可能性がある機能を前提に開発を進めることがなくなるからだ。
アジャイル開発の「カンバン」と同じような考え方だ。


[TOP](#top)
<a id="feature-branch"></a>
### 大きな変更の場合、 feature ブランチを作成して作業する

master に直接マージできないほど巨大な変更を行うことがある。
そんなことをせずに、少しずつ機能を追加して行けたら最高なのだけれど。

こういう場合は、 origin リポジトリに feature ブランチを作成する。

`git create-feature-branch` コマンドで、 feature ブランチが作成される。
（[git-post](https://github.com/sanzen-sekai/git-post) で提供、origin に書き込み権限が無ければ失敗する）

feature ブランチは、 master ブランチと同じ扱いだ。
ただし、 master ブランチに機能追加された場合は常に取り込んでおく必要がある。
この時も、マージした時と同様の検証が走るので、壊れていないことが保証される。

master ブランチ同様、常に動くので、開発が完了したら master にマージできる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

2018年現在の github-flow についてまとめてみた。
今年も色々とやり方が変わるだろうけど、現在大切にしていることを文章にしてみた。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [GitHub Flow](http://scottchacon.com/2011/08/31/github-flow.html)
- [GitHub Flow 翻訳版](https://gist.github.com/Gab-km/3705015)


[TOP](#top)
