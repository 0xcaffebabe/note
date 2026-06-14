
import {ComponentPublicInstance } from 'vue'
import MermaidUtils from './MermaidUtils';
import config from '../config';
import { isMobile as isMobileBp } from '@/composables/useBreakpoint';

export namespace SysUtils {
  // 委托响应式断点单例(视口为主 + 触屏兜底)。脚本处一次性调用仍取实时值；
  // 模板/响应式上下文请直接用 useBreakpoint() 或全局 $isMobile() 以获得跨断点自动重渲染。
  export function isMobile(): boolean{
    return isMobileBp.value
  }

  export function setDocTitle(title: string) {
    document.title = `${title} - ${config.siteName}`
  }

  export function resetDocTitle() {
    document.title = `${config.siteName}`
  }

  export function isDarkMode(): boolean {
    return localStorage.getItem('system::theme') == 'dark'
  }

  // persist=false 用于"跟随系统"场景: 不写入localStorage 避免覆盖用户的手动选择
  export function enterDarkMode(vm: ComponentPublicInstance, persist: boolean = true) {
    vm.$store.commit('setIsDarkMode', true);
    document.body.setAttribute('theme', 'dark');
    document.documentElement.classList.add("dark");
    if (persist) {
      localStorage.setItem('system::theme', "dark");
    }
    MermaidUtils.initWithDark()
  }

  export function enterLightMode(vm: ComponentPublicInstance, persist: boolean = true) {
    vm.$store.commit('setIsDarkMode', false);
    document.body.setAttribute('theme', 'light');
    document.documentElement.classList.remove("dark");
    if (persist) {
      localStorage.setItem('system::theme', "light");
    }
    MermaidUtils.initWithNormal()
  }
}