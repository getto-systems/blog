# rust でカバレッジふたたび

<a id="top"></a>

[以前の記事](/entry/2021/06/12/224949)の内容を高速化してみた。

###### CONTENTS

1. [コードで](#code)
1. [grcov のインストール](#install-grcov)
1. [まとめ](#postscript)
1. [参考資料](#reference)

###### ENVIRONMENTS

<a id="code"></a>

### コードで

```bash
#!/bin/sh

coverage_main() {
    if [ -z "$RUSTUP_HOME" ]; then
        RUSTUP_HOME="${HOME}/.rustup"
    fi

    local toolchain_dir
    local llvm_profdata
    local llvm_cov
    toolchain_dir="${RUSTUP_HOME}/toolchains"
    coverage_setup

    local target_dir
    local prof_dir
    local output_dir
    target_dir="target/debug/deps"
    prof_dir="target/coverage"
    output_dir="ui/public/dist/coverage/api"

    export RUSTFLAGS="-Zinstrument-coverage"
    export LLVM_PROFILE_FILE="${prof_dir}/prof-%p-%m.profraw"

    cargo +nightly test
    if [ "$?" != 0 ]; then
        coverage_cleanup
        exit 1
    fi

    echo "generate coverage report..."
    rm -rf "${output_dir}"
    mkdir -p "${output_dir}"

    local prof_data
    prof_data="${prof_dir}/merged.prodata"
    find "${prof_dir}" -type f -name '*.profraw' | xargs $llvm_profdata merge -sparse -o "${prof_data}"

    if [ ! -f "${prof_data}" ]; then
        echo "failed to merge prof data"
        exit 1
    fi

    local crate_name
    crate_name="$(cat Cargo.toml | grep name | head -1 | cut -d'"' -f2 | sed 's/-/_/g')"

    local ignore_regex
    ignore_regex='(\.cargo|rustc|^api/|/[xyz]_|/infra/|/(main|test|init|data|event|infra)\.rs)'

    local object_file
    local output_file
    for object_file in $(find "${target_dir}" -type f -perm -a+x -name "${crate_name}"'-*'); do
        output_file="${output_dir}/$(basename "${object_file}").info"
        $llvm_cov export "${object_file}" \
            -Xdemangler=rustfilt \
            -instr-profile="${prof_data}" \
            --ignore-filename-regex="${ignore_regex}" \
            --format=lcov >"${output_file}"

        if [ -z "$(cat "${output_file}")" ]; then
            rm -f "${output_file}"
        fi
    done

    grcov "${output_dir}" -t html -o "${output_dir}"

    coverage_cleanup
    coverage_check
}
coverage_setup() {
    llvm_profdata=$(find "${toolchain_dir}" -type f -name llvm-profdata | head -1)
    llvm_cov=$(find "${toolchain_dir}" -type f -name llvm-cov | head -1)

    if [ ! -x "${llvm_profdata}" ]; then
        echo "llvm-profdata not found"
        exit 1
    fi
    if [ ! -x "${llvm_cov}" ]; then
        echo "llvm-cov not found"
        exit 1
    fi
}
coverage_check() {
    local line_coverage
    line_coverage=$(grep abbr "${output_dir}/index.html" | head -1 | cut -d'>' -f 2 | cut -d'%' -f 1)
    case "${line_coverage}" in
    100*)
        echo "OK; line coverage: ${line_coverage}"
        ;;

    *)
        echo "NG; line coverage: ${line_coverage} < 100%"
        exit 1
        ;;
    esac
}
coverage_cleanup() {
    echo "clean up profile files"
    rm -rf "${prof_dir}"
}

coverage_main
```

カバレッジは、`grcov` ではなく、[この Qiita の記事](https://qiita.com/dalance/items/69e18fe300760f8d7de0)を参考にして `llvm-cov` で取ることにした。

`llvm-cov` と `llvm-profdata` にはパスが通っていないので、まずこのコマンドを見つけることから始まる。

テストをして `llvm-profdata` でマージしたら、カバレッジレポートを作成する。
`llvm-cov` が要求する object ファイルは target ディレクトリにクレート名のファイルとして作成されるので、これをとってくる。

カバレッジレポートは lcov 形式で生成し、これを `grcov` で整形する。

`grcov` でカバレッジレポートを作成すると妙に時間がかかる。
すべての object ファイルのカバレッジをとっている雰囲気を感じる。

[TOP](#top)
<a id="install-grcov"></a>

### grcov のインストール

下記スクリプトで `grcov` の最新版をダウンロードする。

```bash
#!/bin/sh

setup_grcov() {
    local version
    version=$(
        curl --silent "https://api.github.com/repos/mozilla/grcov/releases/latest" |
            grep '"tag_name":' |
            sed -E 's/.*"v([^"]+)".*/\1/'
    )
    curl -sSL https://github.com/mozilla/grcov/releases/download/v${version}/grcov-linux-x86_64.tar.bz2 > tmp/grcov.tar.bz2
    tar -xvjf tmp/grcov.tar.bz2

    mv grcov ${CARGO_HOME}/bin
}

setup_grcov
```

cargo install するとソースからコンパイルするので時間がかかる。
バイナリが手に入ればいいので、ダウンロードでいい。

[TOP](#top)
<a id="postscript"></a>

### まとめ

rust のカバレッジレポート作成を高速化してみた。

`grcov` のコンパイルとカバレッジレポートの作成に特に時間がかかっていたので、ここを改善してみた。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [Rust の新しいコードカバレッジ/Source-based code coverage | Qiita](https://qiita.com/dalance/items/69e18fe300760f8d7de0)

[TOP](#top)
