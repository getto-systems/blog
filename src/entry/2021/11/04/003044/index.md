# Rust の mutex を async trait する話

<a id="top"></a>

###### CONTENTS

1. [lock-unlock の間に await してはいけない](#lock-unlock)
1. [まとめ](#postscript)

<a id="lock-unlock"></a>

### lock-unlock の間に await してはいけない

以下コンパイルできるコード。

```rust
use std::{
    collections::HashMap,
    sync::Mutex,
};

#[tokio::test]
async fn test_hmm() {
    assert!(hmm().await == Some("hello, mutex async".to_string()));
}

#[async_trait::async_trait]
trait Hmm {
    async fn hmm() -> Option<String>;
}

struct Resource;

#[async_trait::async_trait]
impl Hmm for Resource {
    async fn hmm() -> Option<String> {
        hmm().await
    }
}

async fn hmm() -> Option<String> {
    const KEY: &'static str = "key";
    let store = Mutex::new(HashMap::new());

    let entry: Option<String>;

    {
        let mut map = store.lock().unwrap();

        map.insert(KEY, "mutex async".to_string());
    }

    {
        let map = store.lock().unwrap();

        if let Some(value) = map.get(KEY) {
            entry = Some(value.clone());
        } else {
            entry = None;
        }
    }

    let generation = generate().await;

    {
        if let Some(value) = entry {
            let mut map = store.lock().unwrap();

            map.insert(KEY, format!("{}, {}", generation, value));
        }
    }

    {
        let map = store.lock().unwrap();

        map.get(KEY).map(|value| value.to_string())
    }
}

async fn generate() -> String {
    "hello".into()
}
```

`generate()` を lock と unlock の間に挟むと async trait の実装のところで以下のエラーになる。

```txt
future cannot be sent between threads safely
within `impl std::future::Future`, the trait `Send` is not implemented for `std::sync::MutexGuard<'_, HashMap<&str, std::string::String>>`
required for the cast to the object type `dyn std::future::Future<Output = std::option::Option<std::string::String>> + Send`
```

async trait のマクロで展開されるときにその中の関数を何かしていて、その時の解析でおかしくなる。
async trait の中じゃなければ問題はないのだけど、よく考えると mutex の lock と unlock の間に await を挟むのは mutex の性質上よろしくないよね。

また、unlock する前に lock しようとすると unwrap のところで実行時に止まる。

mutex の unlock はこまめにするべき。
各ブロックの最後に unlock されるので、細かくブロックを分けて書けばいい。

[TOP](#top)
<a id="postscript"></a>

### まとめ

async trait と mutex を同時に使ったらよくわからないエラーが出たのでまとめてみた。

[TOP](#top)
