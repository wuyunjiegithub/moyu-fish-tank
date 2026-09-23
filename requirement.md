# 摸鱼鱼缸（Fish On Desktop）

## 技术设计文档

版本：v0.1

---

## 1. 项目概述

产品定位

摸鱼鱼缸是一款桌面宠物应用。

核心理念：

> 鱼不在窗口里，鱼就在桌面上游。

用户通过管理客户端添加鱼。

添加后的鱼显示在桌面透明层中持续游动。

关闭管理窗口后，鱼仍然存在。

---

## 2. 技术架构


整体结构：

┌─────────────────────┐
│ React 管理客户端 │
│ Fish Manager │
└──────────┬──────────┘
│
│ Tauri IPC
│
┌──────────▼──────────┐
│ Rust Backend │
│ 文件/窗口/托盘管理 │
└──────────┬──────────┘
│
│
┌──────────▼──────────┐
│ Desktop Fish Layer │
│ React + PixiJS │
└─────────────────────┘


---

## 3. 技术选型


### 3.1 桌面框架

采用：

Tauri 2.x


作用：

- 创建桌面应用
- 管理窗口
- 创建透明窗口
- 系统托盘
- 开机启动
- 文件访问


选择原因：

- 包体积小
- 内存低
- 支持 Windows/macOS
- 适合桌面宠物


---

### 3.2 前端框架


采用：

React + TypeScript

工具链：

- Vite
- React Router
- Zustand


负责：

- 管理界面
- 鱼列表
- 添加鱼
- 设置页面
- 状态管理


---

### 3.3 动画引擎


采用：

PixiJS


负责：

- 桌面鱼渲染
- Sprite动画
- 粒子效果
- 鼠标交互


原因：

React适合UI。

PixiJS适合实时动画。

两者分工：


React

管理

↓

PixiJS

渲染鱼


---

## 4. 项目结构

TODO

---

## 5. 功能模块


### 5.1 管理客户端


React页面。


功能：

- 查看当前鱼
- 添加鱼
- 删除鱼
- 设置


页面：


摸鱼鱼缸

桌面上的鱼

🐠 小金鱼

🐡 胖胖

添加鱼

设置


---

### 5.2 桌面鱼窗口


独立透明窗口。


特点：

- 无边框
- 透明背景
- 始终置顶
- 鼠标事件控制


显示：


桌面

🐟🐠

浏览器窗口

---

### 5.3 Fish对象


每条鱼对应一个对象。


TypeScript：


```ts
interface Fish {

 id:string;

 name:string;

 type:string;


 x:number;

 y:number;


 speed:number;


 state:
   |"idle"
   |"swim"
   |"touch"
   |"eat";


 personality:string;

}
```

## 6. 鱼资源设计

MVP版本

每种鱼一个PNG。

目录：




    assets/fish/
    goldfish/
    fish.png
    config.json
    
    clownfish/
    fish.png
    config.json
    
    betta/
    fish.png
    config.json
    
    puffer/
    fish.png
    config.json

## 7.鱼行为系统

图片负责：

外观。

代码负责：

生命。

状态机：

Idle

随机游动

↓

NearMouse

靠近鼠标

↓

Touch

被摸

↓

Eat

吃东西

↓

Sleep

休息

## 8.数据存储

MVP：

JSON。

位置：

```
appData/
 fishes.json
 settings.json
```


示例：

```
{
 "id":"001",
 "name":"小金",
 "type":"goldfish",
 "x":500,
 "y":300,
 "stage":"adult"
}
```

## 9. React状态管理

采用：

Zustand

保存：

当前鱼列表
设置
UI状态

示例：

```
useFishStore({

 fishes:[],

 addFish(),

 removeFish(),

 updateFish()

})
```

## 10.MVP开发范围

必须完成：

桌面鱼

✅ 透明窗口

✅ 鱼显示

✅ 自动游动

✅ 边界反弹

互动

✅ 鼠标靠近

✅ 点击鱼

✅ 简单反馈

管理

✅ 添加鱼

✅ 删除鱼

✅ 查看鱼列表

保存

✅ 自动保存

✅ 重启恢复

## 11.AI辅助开发

初始化React + Tauri项目
编写PixiJS渲染
编写窗口管理
编写鱼状态机
编写管理页面

鱼素材
图标
UI插画

## 12.最终目标

打开软件：桌面出现鱼。

关闭客户端：鱼继续游。

工作时：偶尔看到鱼。摸一下。获得陪伴感。

产品核心：不是养鱼游戏。是让桌面拥有一点生命。

