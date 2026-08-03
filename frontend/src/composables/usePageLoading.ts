import { nextTick } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';

/**
 * 页面加载状态管理 Composable
 *
 * 设计目标：让"全屏加载页"只在真正需要的时候出现，并在数据 + DOM 全部渲染完毕后自动消失。
 *
 * 解决三大典型问题：
 *  1. 之前用单次 requestAnimationFrame 关 loading，子组件（图表、卡片、图片）还没渲染完就关闭了。
 *  2. 部分页面（如 LoginLogs、OperationLogs、RoleManagement、UserManagement）只置 loading=true，
 *     异步完成后忘记关闭，导致加载页永远盖在内容上。
 *  3. 数据如果已经在 Pinia 里缓存好了，不应该再走一遍 loading，直接用即可。
 *
 * 核心机制：
 *  - nextTick：等待 Vue 把响应式数据同步到 DOM
 *  - 双 requestAnimationFrame：等待浏览器完成布局 + 绘制 + 一帧的子组件挂载
 *  - finally 中强制 loading = false：保证即便任务抛错，加载页也一定会被关掉
 */
export function usePageLoading() {
  const deviceStore = useDeviceStore();

  /**
   * 等待 DOM 完整渲染
   * nextTick + 双 RAF：覆盖 Vue 异步更新 + 浏览器下一帧绘制 + 复杂子组件挂载
   */
  async function waitForRenderComplete(): Promise<void> {
    await nextTick();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }

  /**
   * 判断 store 里是否已经有当前页所需的数据。
   * 子组件可以传一个判断函数；返回 true 时跳过 loading，直接展示。
   */
  function hasDataAvailable(checker: () => boolean): boolean {
    try {
      return checker();
    } catch (e) {
      return false;
    }
  }

  /**
   * 推荐用法：在 onMounted 中包裹数据加载任务。
   * @param tasks 数据加载任务列表（可空，空任务表示仅等待渲染）
   * @param skipIfHasData 可选：store 中已有数据时跳过 loading（避免闪一下）
   */
  async function withLoading(
    tasks: Array<() => Promise<any> | void> = [],
    skipIfHasData?: () => boolean
  ): Promise<void> {
    // 已有数据时：短暂亮一下加载页（≤ 1 帧）让用户感知到切换，但不阻塞内容
    if (skipIfHasData && hasDataAvailable(skipIfHasData)) {
      // 数据已有 → 仍然要等 DOM 完成首屏渲染再关 loading
      await waitForRenderComplete();
      deviceStore.loading = false;
      return;
    }

    deviceStore.loading = true;
    try {
      await Promise.all(
        tasks.map(task => {
          try {
            return Promise.resolve(task());
          } catch (e) {
            return Promise.resolve();
          }
        })
      );
      // 关键：等数据进 store、Vue 响应式更新、DOM 真正画出来之后，再关 loading
      await waitForRenderComplete();
    } catch (e) {
      // 吞掉异常，但仍然保证 loading 关闭
    } finally {
      deviceStore.loading = false;
    }
  }

  /**
   * 手动结束加载页（适用于：onMounted 不需要拉数据，只需等待已有 DOM 渲染完成的场景）
   */
  async function finishLoading(): Promise<void> {
    await waitForRenderComplete();
    deviceStore.loading = false;
  }

  /**
   * 主动开启加载页（适用于：用户点击某个按钮触发加载流程）
   */
  function startLoading(): void {
    deviceStore.loading = true;
  }

  return {
    withLoading,
    finishLoading,
    startLoading,
    waitForRenderComplete,
    hasDataAvailable
  };
}
