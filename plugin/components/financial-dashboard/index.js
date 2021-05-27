import { getSdk, getLifecycleSdk, } from '../../api/sdk';
// import 'dingtalk-jsapi/entry/union';
// import alert from 'dingtalk-jsapi/api/device/notification/alert';

Component({
  data: {
    isMobile: '',
    clickTime: 0,
    result:'',
    propName:'',
    platform: '',
    appLink: {
      zijinliushui: {
        appId: '1197750733', // 微应用或小程序应用的appId，或agentId
        // 要跳转的应用的完整链接，小程序应用是dingtalk开头的链接
        wapUrl: "https://inte-cloud.chanjet.com/ydzee/u7i18242su90/wsa9n5g50a/wapIndex.html",
        pcUrl: "https://inte-cloud.chanjet.com/ydzee/u7i18242su90/3mfkeifu0g/work.html#/home/company"
      },
    },
    myprops:{}
  },
  props: {    
    componentName: '',
    componentProps: { // config.json文件中定义的props可以从componentProps中获取，这里可以设置默认值。如果有在设计器里修改，则会被新值覆盖。

    },
    config: {
      corpId:'123', // 可以通过this.props.config.corpId 获取当前工作台用户的企业corpId
    }
  },
  didMount() {
    getLifecycleSdk().didMount(this.props.componentName);
    // 这里读到的props，和config.json文件中定义的props相对应，详见config.json文件说明
    const props = this.props.componentProps;
    // 业务代码写到下方
    console.log('this.props',this.props);
    this.setData({
      myprops:this.props,
      platform: this.props.config.platform,
    });

    console.log(this.is);
    console.log(this.$page);
    console.log(this.$id);

    // this.props.componentProps.getData1 是个 object，里面包含了 apiKey 以及其他开发者不需要关心的信息，
    // 只要将这个 object 作为sdk.request的第一个参数传入即可
    // const data = await getSdk().request(this.props.componentProps.getData1, { param1: 'test', param2: 3 });
    this.getData();
  },
  didUpdate() {
    getLifecycleSdk().didUpdate(this.props.componentName);
    // 业务代码写到下方


  },

  didUnmount() {
    getLifecycleSdk().didUnmount(this.props.componentName);
    // 业务代码写到下方

  },
  methods: {
    async handleLink (){
      // alert({
      //   message: "点击了",
      //   title: "提示",//可传空
      //   buttonName: "收到",
      // }).then(() => {
      //   console.log('success');
      //     //成功即相当于 onSuccess
      // }, () => {
      //   console.log('onFail');
      //     //失败即相当于 onFail
      // });
      const datas = await getSdk().getSystemInfo();
      console.log(datas,'getSdk().getSystemInfo()',this);
      const isMobile = !this.props.config.platform == 'pc';
      const times = ++this.data.clickTime;
      this.setData({
        isMobile: String(isMobile),
        clickTime: times
      });
      const {zijinliushui} = this.data.appLink;
      console.log(zijinliushui)
      // 打开微应用
      getSdk().openApp({
        name:'pc打开了',
        appId: zijinliushui.appId, // 微应用或小程序应用的appId，或agentId
        // 要跳转的应用的完整链接，小程序应用是dingtalk开头的链接
        url: isMobile ? zijinliushui.wapUrl : zijinliushui.pcUrl,
        openType: 'open_slide_panel'
      });
    },
    async getData(){
      try {
        console.log('this.props.componentProps',this.props.componentProps.apikeytestPropName);
        const datas = await getSdk().request(this.props.componentProps.apikeytestPropName, { name: 'test', no: 3 });
        this.setData({
          propName: this.props.componentProps.apikeytestPropName,
          result: JSON.stringify(datas)
        });
      } catch (error) {
        this.setData({
          result: JSON.stringify(error)
        });
      }
     
    },
    handleChart(){
      // alert({
      //   message: "点击charts",
      //   title: "提示",//可传空
      //   buttonName: "收到",
      // }).then(() => {
      //   console.log('success');
      //     //成功即相当于 onSuccess
      // }, () => {
      //   console.log('onFail');
      //     //失败即相当于 onFail
      // });
    },
    onInitChart(F2, config) {
      const chart = new F2.Chart(config);
      const data = [
        { value: 63.4, city: 'New York', date: '2011-10-01' },
        { value: 62.7, city: 'Alaska', date: '2011-10-01' },
        { value: 72.2, city: 'Austin', date: '2011-10-01' },
        { value: 58, city: 'New York', date: '2011-10-02' },
        { value: 59.9, city: 'Alaska', date: '2011-10-02' },
        { value: 67.7, city: 'Austin', date: '2011-10-02' },
        { value: 53.3, city: 'New York', date: '2011-10-03' },
        { value: 59.1, city: 'Alaska', date: '2011-10-03' },
        { value: 69.4, city: 'Austin', date: '2011-10-03' },
      ];
      chart.source(data, {
        date: {
          range: [0, 1],
          type: 'timeCat',
          mask: 'MM-DD'
        },
        value: {
          max: 300,
          tickCount: 4
        }
      });
      chart.area().position('date*value').color('city').adjust('stack');
      chart.line().position('date*value').color('city').adjust('stack');
      chart.render();
      // 注意：需要把chart return 出来
      return chart;
    }
  },
});
