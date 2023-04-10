import "bootstrap/dist/css/bootstrap.min.css";
import { createApp } from "vue";
import App from "./App.vue";
import "./assets/css/main.css";
import "bootstrap";
// @ts-ignore
import i18n from "./i18n";
import moment from "moment";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import VueSocialSharing from 'vue-social-sharing'

const app = createApp(App);

app.use(i18n as any);
app.use(VueSocialSharing);

app.component('VueDatePicker', VueDatePicker);

app.mount("#app");

app.config.globalProperties.$filters = {
  formatDate(value: string) {
    if (value) {
      return moment(String(value)).format("Y-MM-DD");
    }
  },
};
