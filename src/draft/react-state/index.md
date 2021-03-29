# ぼくのかんがえたさいきょうの状態管理

<a id="top"></a>

UI の状態管理に関する現在の理解について。

-   production には未適用
-   React としてアンチパターンな気がする

###### CONTENTS

1. [１言で](#subject)
1. [コードで](#code)
1. [データから状態を構築するということ](#create-state-by-data)
1. [まとめ](#postscript)
1. [参考資料](#reference)

<a id="subject"></a>

### １言で

-   状態とデータをはっきり区別する
    -   状態: UI の構築に必要な情報
    -   データ: 状態を構築するための情報
-   状態は直前の状態から構築するのではなく、データから構築する

[TOP](#top)
<a id="code"></a>

### コードで

-   UI ライブラリ: [preact](https://preactjs.com/)
-   テンプレート: [htm](https://github.com/developit/htm)

メニューの描画を行う MenuComponent を考えてみる。

-   MenuComponent: MenuAction から UI を構築する
-   MenuAction: データから状態を構築する

MenuAction が何者か、ということをひとまず置いておけば、MenuComponent については普通の React Component だ。

```typescript
import { h, VNode } from "preact"
import { useState, useLayoutEffect, useMemo } from "preact/hooks"
import { html } from "htm/preact"

function Component(): VNode {
    const action = useMemo(initMenuAction, [])
    return h(MenuComponent, { action })
}

interface MenuComponent {
    (props: Props): VNode
}
type Props = Readonly<{ action: MenuAction }>

interface MenuAction {
    readonly initialState: MenuState
    subscribe(handler: { (state: MenuState): void }): void
    unsubscribe(handler: { (state: MenuState): void }): void

    show(label: string): void
    hide(label: string): void

    loadBadge(): void
}

type MenuState = Readonly<{ menu: Menu }>
type Menu = MenuCategory[]
type MenuCategory = Readonly<{
    label: string
    badgeCount: number
    isExpand: boolean
    children: MenuItem[]
}>
type MenuItem = Readonly<{
    label: string
    badgeCount: number
}>

function MenuComponent(props: Props): VNode {
    const [state, setState] = useState(props.action.initialState)
    useLayoutEffect(() => {
        props.action.subscribe(setState)
        return () => props.action.unsubscribe(setState)
    }, [props.action])

    return html`${loadBadgeButton()} ${menu(state.menu)}`

    function loadBadgeButton(): VNode {
        return html`<button onClick=${loadBadge}>load badge count</button>`

        function loadBadge() {
            props.action.loadBadge()
        }
    }

    function menu(menu: Menu): VNode {
        return html`<ul>
            ${menu.map(category)}
        </ul>`
    }

    function category(category: MenuCategory): VNode {
        return html`<li key="${category.label}">${details(category)}</li>`

        function details(category: MenuCategory): VNode {
            return html`<details
                open=${category.isExpand}
                onClick=${category.isExpand ? hide : show}
            >
                <summary>${category.label} ${category.badgeCount}</summary>
                <ul>
                    ${category.children.map(item)}
                </ul>
            </details>`

            function show(e: Event) {
                e.preventDefault()
                props.action.show(category.label)
            }
            function hide(e: Event) {
                e.preventDefault()
                props.action.hide(category.label)
            }
        }
    }
    function item(item: MenuItem): VNode {
        return html`<li key="${item.label}">${item.label} ${item.badgeCount}</li>`
    }
}

function initMenuAction(): MenuAction {
    return new Action([
        { label: "MAIN", children: ["home", "docs"] },
        { label: "CONTENT", children: ["mail", "notice"] },
    ])
}

class Action implements MenuAction {
    initialState: MenuState
    handlers: { (state: MenuState): void }[] = []

    tree: MenuTree
    expand: MenuExpand = new Set()
    badge: MenuBadge = new Map()

    constructor(tree: MenuTree) {
        this.tree = tree
        this.initialState = { menu: this.buildMenu() }
    }

    post(state: MenuState): void {
        this.handlers.forEach((handler) => handler(state))
    }

    subscribe(handler: { (state: MenuState): void }): void {
        this.handlers.push(handler)
    }
    unsubscribe(target: { (state: MenuState): void }): void {
        this.handlers = this.handlers.filter((handler) => handler !== target)
    }

    show(label: string): void {
        this.expand.add(label)

        this.post({ menu: this.buildMenu() })
    }
    hide(label: string): void {
        this.expand.delete(label)

        this.post({ menu: this.buildMenu() })
    }

    loadBadge(): void {
        // リモートからバッヂ数を取得しているつもり
        const newBadge: MenuBadge = new Map()
        newBadge.set("mail", Math.floor(Math.random() * 20))
        newBadge.set("notice", Math.floor(Math.random() * 20))

        this.badge = newBadge

        this.post({ menu: this.buildMenu() })
    }

    buildMenu(): Menu {
        return menu(this.tree, this.expand, this.badge)
    }
}

type MenuTree = Readonly<{
    label: string
    children: string[]
}>[]
type MenuExpand = Set<string>
type MenuBadge = Map<string, number>

function menu(tree: MenuTree, expand: MenuExpand, badge: MenuBadge): Menu {
    return tree.map(
        (category): MenuCategory => {
            const children = category.children.map(
                (label): MenuItem => ({
                    label,
                    badgeCount: badge.get(label) || 0,
                }),
            )
            return {
                label: category.label,
                isExpand: expand.has(category.label),
                badgeCount: children.reduce((acc, item) => acc + item.badgeCount, 0),
                children,
            }
        },
    )
}
```

#### MenuAction は何者か

MenuAction はデータから状態を生成する役割の何か。
自分の中では Action と呼んでいる。

この例では、状態 Menu をデータ MenuTree, MenuExpand, MenuBadge から生成している。

MenuComponent が欲しいのは状態の Menu である。
Menu がどう構築されているかは興味がない。
Menu の構築を MenuAction に任せれば、MenuComponent は UI の構築に専念できる。

[TOP](#top)
<a id="create-state-by-data"></a>

### データから状態を構築するということ

直前の状態から次の状態を生成するということは、状態をデータベースとして扱うということだ。
つまり、データベースとして対応しなければならないことすべてに対応する必要がある。

データが同期的に変更されるなら特に複雑なことはない。
しかし、非同期的に変更される場合は複雑な対応が必要だ。
そして、UI が扱う状態は基本的に非同期的な変更だ。

したがって、直前の状態から次の状態を生成する場合、状態管理ライブラリを使用して複雑なことに対応する必要が出てくる。
状態に対する変更リクエストをすべて直列化して、変更を逐次適用していく、といった対応だ。

そこで、以下のルールを考えてみる。

-   状態は直前の状態から構築するのではなく、データから構築する

このルールを守れば、特に複雑なことを考える必要はなく、状態管理ライブラリも必要なくなるはず。

#### MenuAction の扱うデータについて

MenuAction は以下のデータを持っている。

-   MenuTree: メニューの構造
-   MenuBadge: 通知バッヂ数
-   MenuExpand: 開閉状態

このデータの扱いについて詳しく見てみる。

-   MenuTree: 静的。コンパイル時に決定する
-   MenuBadge: キャッシュ。取得したバッヂ数を保存しておく
-   MenuExpand: 動的。メニューの開閉のたびに変更される

MenuBadge は単にキャッシュ。
取得したデータで上書きしていくだけで特に気を使うところはない。

MenuExpand は開閉状態のデータベース。
この例では `Set#add` や `Set#delete` を直接呼び出していて同期的なので複雑なことはない。

ということで、MenuAction の仕事はデータが変更されたら menu を再構築して `setState` に通知するだけの簡単なお仕事になる。

[TOP](#top)
<a id="postscript"></a>

### まとめ

直前の状態から次の状態を生成する、というのが複雑さの原因と考えた結果こんな具合になった。

[TOP](#top)
<a id="reference"></a>

### 参考資料

-   [preactjs.com](https://preactjs.com/)
-   [htm | GitHub : developit/htm](https://github.com/developit/htm)

[TOP](#top)
