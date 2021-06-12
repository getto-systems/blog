# rust でカバレッジをとってみる

<a id="top"></a>

###### CONTENTS

1. [コードで](#code)
1. [必要な準備](#prepare)
1. [カバレッジをとる](#report-coverage)
1. [カバレッジが 100% じゃなかったらエラーにする](#check-coverage)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### ENVIRONMENTS

-   rust: 1.51

<a id="code"></a>

### コードで

以下の shell script でカバレッジをとることができる。

```bash
rustup component add llvm-tools-preview
rustup install nightly
cargo install grcov

export RUSTFLAGS="-Zinstrument-coverage"
export LLVM_PROFILE_FILE="target/coverage/%m-%p.profraw"

cargo +nightly build
cargo +nightly test

grcov ./target/coverage \
    -s . \
    --binary-path ./target/debug \
    --llvm \
    --branch \
    --ignore-not-existing \
    -t html -o ./coverage

rm -rf ./target/coverage
```

mozilla のやつってことで [grcov](https://github.com/mozilla/grcov) を選んでみた。

[TOP](#top)
<a id="prepare"></a>

### 必要な準備

カバレッジをとるツールをインストールする。

```bash
rustup component add llvm-tools-preview
rustup install nightly
cargo install grcov
```

grcov は `llvm-tools-preview` を使ってレポートを作る。
また、grcov を使ってカバレッジをとるには `nightly` な rust が必要。
grcov 自体は `cargo install grcov` で `$HOME/.cargo/bin` にインストールできる。

[TOP](#top)
<a id="report-coverage"></a>

### カバレッジをとる

```bash
export RUSTFLAGS="-Zinstrument-coverage"
export LLVM_PROFILE_FILE="target/coverage/%m-%p.profraw"

cargo +nightly build
cargo +nightly test

grcov ./target/coverage \
    -s . \
    --binary-path ./target/debug \
    --llvm \
    --branch \
    --ignore-not-existing \
    -t html -o ./coverage
```

`instrument-coverage` フラグをつけて `nightly` ビルド、テストをすると、`profraw` ファイルが生成される。
`profraw` ファイルの名前は `LLVM_PROFILE_FILE` で指定する。

この `profraw` ファイルから grcov でレポートを生成できる。

grcov のオプションは以下の通り。

-   path: `profraw` ファイルを出力したディレクトリを指定
-   `-s`: ソースのルートを指定
-   `--binary-path`: build したバイナリを指定
-   `--llvm`: なんか速くなるらしい
-   `--branch`: branch カバレッジを取れるらしい。うまくいってない。よくわからん
-   `--ignore-not-existing`: つけないとエラーになる。ライブラリのソース探しに行ってる雰囲気を感じる
-   `-t html -o ./coverage`: html 形式で指定したディレクトリにレポートを出力
-   `--ignore`: `--ignore tests/**` とか、glob で無視するファイルを指定

[TOP](#top)
<a id="check-coverage"></a>

### カバレッジが 100% じゃなかったらエラーにする

カバレッジ 100% を目指すのはあんまり意味ない。
けど、無視するファイルを上手く指定してやれば、テストもれを検出できる。

grcov が出力した html から以下のコマンドで 100% か確認できる。

```bash
grep abbr "${output_dir}/index.html" | head -1 | grep "100 %"
```

abbr タグでサマリがマークアップされている。
line, function, branch の順に並んでいるので、これの最初のやつを確認する。

とりあえず line カバレッジが 100% になればいいかな。

[TOP](#top)
<a id="postscript"></a>

### まとめ

rust でカバレッジをとる方法をまとめた。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [mozilla/grcov | GitHub](https://github.com/mozilla/grcov)
-   [Rust の新しいコードカバレッジ/Source-based code coverage](https://qiita.com/dalance/items/69e18fe300760f8d7de0)

[TOP](#top)
