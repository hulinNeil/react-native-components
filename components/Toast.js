import React, { Component } from 'react';
import RootView from './common/RootView'
import ToastView from './common/ToastView'

// fixed by hulin 目前使用View模拟toast，后期如果有mac设备可以考虑使用引入原生模块的方式，这样体验会好点。

class Toast {
    static show(msg) {
        RootView.setView(
            <ToastView message={msg} onDismiss={() => RootView.setView()} />
        )
    }

    static show(msg, time) {
        RootView.setView(<ToastView message={msg} time={time} onDismiss={() => RootView.setView()} />)
    }
}

export default Toast