# 用户验证处理

## 场景一

1. 初次启动应用，显示登录注册页面
2. 登录成功后，显示登录后的页面
3. 在token有效期内，自动登录

### 流程图

```mermaid
start --[getToken]--> {hasToken}



```

1. 登录验证，获得`JWT_TOKEN`,
2. 使用`JWT_TOKEN`获取用户基本数据，并且通过AsyncStorage进行缓存

### 重新启动处理

1. 尝试从 AsyncStorage 中获取`JWT_TOKEN`
2. 检验有效期，如果在有效期内，
  1. 直接使用`JWT_TOKEN`，从AsyncStorage中获取数据，并且直接渲染已处于登录状态下的页面
  2. 访问获取用户基本数据接口，如果成功，则替换用户数据，更新缓存
3. 如果已经过期，则显示登录页面

### `access_token` 与 `refresh_token` 的使用

问题1：何时使用`refresh_token`来获取新的`access_token`


