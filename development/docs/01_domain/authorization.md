# 認可 (Authorization)

認可は、認証されたユーザーが特定のリソースやアクションにアクセスできるかどうかを決定するプロセスです。
認可は、ユーザーの役割、権限、または属性に基づいてアクセス制御を実施します。

## 認可の概念

独自の権限モデルを利用している。

### 権限

ユーザはロールという概念があり、分類される。

| ロール名 | 説明                 |
| -------- | -------------------- |
| `ADMIN`  | システム全体の管理者 |
| `USER`   | 一般的なユーザー     |

`USER`はAPIアクセスが限定される。

## 認証プロバイダ

Firebase Authenticationを使用して、認証システムを構築する。

対応する認証方法:

- メール/パスワード認証（`FIREBASE_EMAIL`）
- Googleアカウント認証（`FIREBASE_GOOGLE`）
- 匿名認証（`FIREBASE_ANONYMOUS`、ゲストアカウント）

### ユーザーの識別と認証方式の切り替え

1ユーザー（`MUser`）が持つ認証方式は常に1つ（`MAuthProvider`が1行）。メール/パスワード（`FIREBASE_EMAIL`）とGoogle（`FIREBASE_GOOGLE`）の間で切り替えられる。切り替えてもFirebase UIDは変わらず、データはそのまま引き継がれる。

Firebase Authenticationは「1メールアドレス1アカウント」の設定で運用する。この設定では、メール/パスワードで登録済みのユーザーが同じメールアドレスのGoogleアカウントでログインすると、同じFirebase UIDのアカウントにログインする。

- APIの認証（`honoAuthMiddleware`）とユーザー登録（`POST /api/v1/user/auth/register`）は、IDトークンの認証方式が`FIREBASE_EMAIL` / `FIREBASE_GOOGLE`の場合、UIDが一致する行を認証方式を問わず同一ユーザーとして扱う。登録時に既存ユーザーがいれば`MUser`は作成せず既存ユーザーを返す（退会済みなら`USER_QUIT`）
- 匿名認証（ゲスト）は認証方式とUIDの完全一致で判定し、切り替えの対象外

#### 認証方式切り替えAPI（`PUT /api/v1/user/auth/provider`）

リクエスト: `{ "providerType": "FIREBASE_EMAIL" | "FIREBASE_GOOGLE" }`
レスポンス: `{ "providerType": ..., "switched": boolean }`（`switched`は`MAuthProvider.providerType`が変わったかどうか）

1. ゲストは`INVALID_REQUEST`
2. Firebaseアカウントに切り替え先の認証方式（`password` / `google.com`）が紐付いていなければ`INVALID_REQUEST`
3. 切り替え先以外の認証方式をFirebaseアカウントから外す（Admin SDKの`providersToUnlink`）
4. `MAuthProvider.providerType`を切り替え先に更新する（同じ方式なら更新しない）

#### 切り替えの導線

| 導線                               | メール/パスワード → Google                                              | Google → メール/パスワード                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 認証情報画面                       | Googleアカウントを紐付けてから切り替えAPIを呼ぶ                         | パスワードを設定してから切り替えAPIを呼ぶ                                                                  |
| ログイン画面（同じメールアドレス） | Googleでログインすると、ログイン後に切り替えAPIを呼びGoogleへ切り替わる | パスワード再設定後にパスワードでログインすると、ログイン後に切り替えAPIを呼びメール/パスワードへ切り替わる |
