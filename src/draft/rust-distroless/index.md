# Rust で distroless する話

<a id="top"></a>

###### CONTENTS

1. [なんでそんなことをするのか](#purpose)
1. [rustup でターゲットを追加](#rustup-add-target)
1. [musl コンパイラをインストール](#install-musl-tools)
1. [ビルド](#build)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### ENVIRONMENTS

-   debian: buster
-   distroless/static-debian10
-   rust: 1.51.0 (2fd73fabe 2021-03-23)

<a id="purpose"></a>

### なんでそんなことをするのか

distroless を使えば OS のセキュリティパッチを追いかけなくていいので、distroless イメージにバイナリをコピーするだけにしたい。

[TOP](#top)
<a id="rustup-add-target"></a>

### rustup でターゲットを追加

distroless にバイナリをコピーするだけで動くようにするには、`x86_64-unknown-linux-musl` をターゲットにする必要がある。
そのために rustup でターゲットを追加する。

```bash
rustup target add x86_64-unknown-linux-musl
```

これで `x86_64-unknown-linux-musl` をターゲットにしてコンパイルできるようになる。

[TOP](#top)
<a id="install-musl-tools"></a>

### musl コンパイラをインストール

actix-web をコンパイルしようとしたら、musl のコンパイラがない、と文句を言われた。
musl-tools をインストールすることで解消できる。

```bash
apt-get update
apt-get install -y musl-tools 
```

[TOP](#top)
<a id="build"></a>

### ビルド

準備が整ったら cargo build するだけ。

```bash
cargo build --release --target x86_64-unknown-linux-musl
# => target/x86_64-unknown-linux-musl/release/{BIN}
```

target を指定するとそのターゲット名のディレクトリにバイナリが生成される。

[TOP](#top)
<a id="postscript"></a>

### まとめ

distroless イメージ上で動かすためのビルドの仕方をまとめた。
参考にした記事では「静的リンク」と言っていたのだけど、検索ではほとんどヒットしなかったので備忘録としてまとめた。

ただ、musl でビルドするために追加でツールが必要だったので、他にも対応しなければならないことがありそう。

あと mac で開発することにしたので開発時のターゲットと本番用のターゲットが全然違うものになる。
できれば同じような環境にしたいところだけれど、とりあえずこれでやってみる。

[TOP](#top)
<a id="reference"></a>

### 参考資料

- [musl-gcc | General Commands Manual | debian](https://manpages.debian.org/stretch/musl-tools/musl-gcc.1.en.html)
-   [RustのLinux muslターゲット （その1：Linux向けのポータブルなバイナリを作る） | Oxidized Bookshelf](https://blog.rust-jp.rs/tatsuya6502/posts/2019-12-statically-linked-binary/)

[TOP](#top)
