# Rust でカバレッジを取る話
<a id="top"></a>

###### CONTENTS

1. [Rust でカバレッジを取るには](#how-to)
1. [cargo-llvm-cov のインストール](#install)
1. [まとめ](#postscript)
1. [参考資料](#reference)


<a id="how-to"></a>
### Rust でカバレッジを取るには

[この記事](https://qiita.com/dalance/items/69e18fe300760f8d7de0)のとおり、ツールが整ってきたので、以下のコマンドでカバレッジを取りつつテストができる。

```bash
cargo install cargo-llvm-cov
rustup component add llvm-tools-preview
cargo llvm-cov
```

`cargo llvm-cov` で、テストが走ってカバレッジが計測される。


[TOP](#top)
<a id="install"></a>
### cargo-llvm-cov のインストール

`cargo install cargo-llvm-cov` でインストールすると、ソースからのビルドになるので時間がかかる。
そこで、CI では以下のように github からビルド済みバイナリをダウンロードするようにした。

```bash
#!/bin/sh

local target
target=$1
if [ -z "$target" ]; then
  echo "usage: setup-test.sh <install-dir>"
  exit 1
fi
mkdir -p $target

install_cargo_llvm_cov

install_cargo_llvm_cov() {
  local version
  version=$(
    curl --silent "https://api.github.com/repos/taiki-e/cargo-llvm-cov/releases/latest" | \
    grep '"tag_name":' | \
    sed -E 's/.*"v([^"]+)".*/\1/' \
  )

  curl -L -o $target/cargo-llvm-cov.tar.gz https://github.com/taiki-e/cargo-llvm-cov/releases/download/v${version}/cargo-llvm-cov-x86_64-unknown-linux-musl.tar.gz
  cd $target
  tar xvzf cargo-llvm-cov.tar.gz
  rm cargo-llvm-cov.tar.gz
  cd -
}
```

ただし、github が落ちてると CI も落ちる。


[TOP](#top)
<a id="postscript"></a>
### まとめ

Rust のカバレッジが簡単に取れるようになった、というお話でした。


[TOP](#top)
<a id="reference"></a>
### 参考資料

- [Rustの新しいコードカバレッジ/Source-based code coverage | Qiita](https://qiita.com/dalance/items/69e18fe300760f8d7de0)


[TOP](#top)
