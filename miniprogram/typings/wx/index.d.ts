/// <reference path="./lib.wx.api.d.ts" />
/// <reference path="./lib.wx.app.d.ts" />
/// <reference path="./lib.wx.component.d.ts" />
/// <reference path="./lib.wx.page.d.ts" />
/// <reference path="./lib.wx.cloud.d.ts" />

declare namespace WechatMiniprogram {
  interface Wx {
    // 基础
    canIUse(schema: string): boolean;
    base64ToArrayBuffer(base64: string): ArrayBuffer;
    arrayBufferToBase64(buffer: ArrayBuffer): string;
    getSystemInfoSync(): SystemInfo;
    getSystemInfo(option: GetSystemInfoOption): void;
    
    // 路由
    navigateTo(option: NavigateToOption): void;
    redirectTo(option: RedirectToOption): void;
    switchTab(option: SwitchTabOption): void;
    navigateBack(option?: NavigateBackOption): void;
    
    // 界面
    showToast(option: ShowToastOption): void;
    hideToast(option?: HideToastOption): void;
    showLoading(option: ShowLoadingOption): void;
    hideLoading(option?: HideLoadingOption): void;
    showModal(option: ShowModalOption): void;
    showActionSheet(option: ShowActionSheetOption): void;
    
    // 网络
    request<T = any>(option: RequestOption<T>): RequestTask;
    uploadFile(option: UploadFileOption): UploadTask;
    downloadFile(option: DownloadFileOption): DownloadTask;
    
    // 数据缓存
    setStorage<T = any>(option: SetStorageOption<T>): void;
    setStorageSync<T = any>(key: string, data: T): void;
    getStorage<T = any>(option: GetStorageOption<T>): void;
    getStorageSync<T = any>(key: string): T;
    removeStorage(option: RemoveStorageOption): void;
    removeStorageSync(key: string): void;
    clearStorage(option?: ClearStorageOption): void;
    clearStorageSync(): void;
    
    // 媒体
    chooseImage(option: ChooseImageOption): void;
    previewImage(option: PreviewImageOption): void;
    getImageInfo(option: GetImageInfoOption): void;
    saveImageToPhotosAlbum(option: SaveImageToPhotosAlbumOption): void;
    
    // 文件
    saveFile(option: SaveFileOption): void;
    getFileInfo(option: GetFileInfoOption): void;
    getSavedFileList(option?: GetSavedFileListOption): void;
    removeSavedFile(option: RemoveSavedFileOption): void;
    
    // 位置
    getLocation(option: GetLocationOption): void;
    chooseLocation(option: ChooseLocationOption): void;
    openLocation(option: OpenLocationOption): void;
    
    // 设备
    getNetworkType(option?: GetNetworkTypeOption): void;
    onNetworkStatusChange(callback: OnNetworkStatusChangeCallback): void;
    getSystemInfoSync(): SystemInfo;
    vibrateLong(option?: VibrateLongOption): void;
    vibrateShort(option?: VibrateShortOption): void;
    
    // 界面
    createSelectorQuery(): SelectorQuery;
    createIntersectionObserver(
      component: Component.TrivialInstance,
      options?: CreateIntersectionObserverOption
    ): IntersectionObserver;
    
    // 开放接口
    login(option?: LoginOption): void;
    checkSession(option?: CheckSessionOption): void;
    authorize(option: AuthorizeOption): void;
    getUserInfo(option: GetUserInfoOption): void;
    getUserProfile(option: GetUserProfileOption): void;
    
    // 支付
    requestPayment<
      T extends string | IAnyObject | ArrayBuffer =
        | string
        | IAnyObject
        | ArrayBuffer
    >(option: RequestPaymentOption<T>): void;
    
    // 数据上报
    reportMonitor(name: string, value: number): void;
    reportAnalytics(eventName: string, data: Record<string, any>): void;
    
    // 更新
    getUpdateManager(): UpdateManager;
    
    // 调试
    setEnableDebug(option: SetEnableDebugOption): void;
    
    // 定时器
    setTimeout(callback: (...args: any[]) => void, timeout: number): number;
    clearTimeout(timeoutID: number): void;
    setInterval(callback: (...args: any[]) => void, timeout: number): number;
    clearInterval(intervalID: number): void;
    
    // 云开发
    cloud: WechatMiniprogram.Cloud;
  }

  // 基础类型定义
  interface IAnyObject {
    [key: string]: any;
  }

  interface IAPIError {
    errMsg: string;
  }

  interface IAPIParam<T = any> {
    success?: (res: T) => void;
    fail?: (err: IAPIError) => void;
    complete?: (res: T | IAPIError) => void;
  }

  interface IAPIResponse {
    errMsg: string;
    errCode: number;
    [key: string]: any;
  }

  // 系统信息
  interface SystemInfo {
    brand: string;
    model: string;
    pixelRatio: number;
    screenWidth: number;
    screenHeight: number;
    windowWidth: number;
    windowHeight: number;
    statusBarHeight: number;
    language: string;
    version: string;
    system: string;
    platform: string;
    fontSizeSetting: number;
    SDKVersion: string;
    benchmarkLevel: number;
    albumAuthorized: boolean;
    cameraAuthorized: boolean;
    locationAuthorized: boolean;
    microphoneAuthorized: boolean;
    notificationAuthorized: boolean;
    notificationAlertAuthorized: boolean;
    notificationBadgeAuthorized: boolean;
    notificationSoundAuthorized: boolean;
    bluetoothEnabled: boolean;
    locationEnabled: boolean;
    wifiEnabled: boolean;
    safeArea: SafeArea;
  }

  interface SafeArea {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  }

  // 用户信息
  interface UserInfo {
    nickName: string;
    avatarUrl: string;
    gender: number;
    country: string;
    province: string;
    city: string;
    language: string;
  }

  // 位置信息
  interface Location {
    latitude: number;
    longitude: number;
    speed: number;
    accuracy: number;
    altitude: number;
    verticalAccuracy: number;
    horizontalAccuracy: number;
  }

  // 网络状态
  interface NetworkTypeResult {
    networkType: string;
  }

  // 基础回调函数
  type EventCallback = (event: BaseEvent) => void;
  type TouchEventCallback = (event: TouchEvent) => void;
  type CustomEventCallback<T = any> = (event: CustomEvent<T>) => void;

  // 基础事件对象
  interface BaseEvent {
    type: string;
    timeStamp: number;
    target: Target;
    currentTarget: CurrentTarget;
    mark?: IAnyObject;
  }

  interface Target {
    id: string;
    dataset: IAnyObject;
  }

  interface CurrentTarget extends Target {}

  // 触摸事件对象
  interface TouchEvent extends BaseEvent {
    touches: Touch[];
    changedTouches: Touch[];
  }

  interface Touch {
    identifier: number;
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
  }

  // 自定义事件对象
  interface CustomEvent<T = any> extends BaseEvent {
    detail: T;
  }
} 