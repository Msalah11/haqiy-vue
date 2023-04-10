<script setup lang="ts">
import { Form, Field, ErrorMessage } from "vee-validate";
import { ref, watchEffect } from "vue";
import { useApi } from "@/composable/useApi";
import {useI18n} from "vue-i18n";
import * as yup from "yup";

const formSchema = yup.object({
  salary: yup.string().required(),
});

const api = useApi();
const {t, locale} = useI18n();
const currentLocale = locale.value;
const copyright = t('copyrights');
const lastPostId = ref(0);
const linkToShare = ref('');

const serviceStatus = [
  { name: t('stillWorking'), value: 1 },
  { name: t('terminated'), value: 2 },
  { name: t('resigned'), value: 3 },
];

const terminatedService = [
  { name: t('death'), value: 1 },
  { name: t('inability'), value: 2 },
  { name: t('normalServiceTermination'), value: 3 },
];

const weekDays = [
  t('monday'),
  t('tuesday'),
  t('wednesday'),
  t('thursday'),
  t('friday'),
  t('saturday'),
  t('sunday')
]

const formData = ref({
  salary: 0,
  startServiceDate: ref(''),
  endServiceDate: ref(''),
  name: ref(''),
  phone: ref(''),
  serviceStatus: 1,
  terminatedService: "",
  advanced: false,
  paidDays: 0,
  unpaidDays: 0,
  remember: "0_1"
});

const total = ref({
  serviceDaysCount: 0,
  dayRate: 0,
  offDaysCount: 0,
  offDaysTotal: "0",
  endDaysCount: 0,
  endDaysTotal: 0,
});

const calcTotalServiceDays = () => {
  const startDateTime = new Date(formData.value.startServiceDate).getTime();
  const endDateTime = new Date(formData.value.endServiceDate).getTime();

  if(endDateTime <= startDateTime) {
    alert('start date must be greater than end date');
    return;
  }

  const difference = endDateTime - startDateTime;
  return Math.ceil(difference / (1000 * 3600 * 24)) + 1;
}

const calcDaysOffCount = (totalDays: number) => {
  const totalYears = Math.floor(totalDays / 365 );
  const rate = totalYears <= 5 ? 21 : 28;

  // if unpaid => 30 / 365 * (TOTAL SERVICE DAYS - UNPAID DAYS)
  if (formData.value.unpaidDays > 0 &&  formData.value.paidDays <= 0) {
    return Math.floor( rate / 365  * (totalDays -  formData.value.unpaidDays ) );
  }

  // if paid => 30 / 365  * TOTAL SERVICE DAYS - PAID DAYS
  if (formData.value.unpaidDays <= 0 &&  formData.value.paidDays > 0) {
    return Math.floor( rate / 365  * totalDays -  formData.value.paidDays);
  }

  // if (paid & unpaid) => 30 / 365  * ( TOTAL SERVICE DAYS - UNPAID DAYS ) - PAID DAYS
  if(formData.value.unpaidDays > 0 && formData.value.paidDays > 0) {
    return Math.floor( rate / 365  * ( totalDays - formData.value.unpaidDays ) - formData.value.paidDays )
  }

  //if not (paid or unpaid) 30  / 365 * TOTAL SERVICE DAYS
  return Math.floor(rate  / 365 * totalDays );
}

const calcEndDaysCount = (totalDays: number) => {
  const totalYears = Math.floor(totalDays / 365 );
  let endServiceDaysCount = 0;

  for(let year = 1; year <= totalYears; year++) {
    const daysCount = year <= 3 ? 15 : 30;
    endServiceDaysCount += daysCount / 356 * totalDays;
  }

  return Math.floor(endServiceDaysCount);
}

const calcEndDaysTotal = (endServiceRate: number, totalDays: number) => {
  let total = endServiceRate;

  if(formData.value.serviceStatus === 3) {
    const totalServiceDaysInYears = Math.floor(totalDays / 365);

    if(totalServiceDaysInYears < 3) {
      total = 0;
    }

    if(totalServiceDaysInYears >= 3 && totalServiceDaysInYears <= 5) {
      total = endServiceRate / 2;
    }

    if(totalServiceDaysInYears > 5 && totalServiceDaysInYears <= 10) {
      total = (formData.value.salary / 3) * 2;
    }

  }

  return  Math.floor( total );
}

watchEffect(() => {
  const totalDays = calcTotalServiceDays() ?? 0;
  let dayRate:any = 0;

  if(totalDays > 0) {
    total.value.serviceDaysCount = totalDays
    const offDaysCount = calcDaysOffCount(totalDays);
    total.value.offDaysCount = offDaysCount > 0 ? offDaysCount : 0;
  }

  if(formData.value.salary > 0 && total.value.offDaysCount > 0) {
    dayRate = (formData.value.salary / 30).toFixed(2);
    total.value.dayRate = dayRate;
    total.value.offDaysTotal = Math.floor(dayRate * total.value.offDaysCount ).toFixed(2) ?? 0;
  }

  if(totalDays > 0 && dayRate > 0) {
    total.value.endDaysCount = calcEndDaysCount(totalDays) ?? 0;
    const endServiceRate = dayRate * total.value.endDaysCount;
    total.value.endDaysTotal = calcEndDaysTotal(endServiceRate, totalDays) ?? 0;
  }
});

const storeData = async () => {
  const requestData = {
    title: `${formData.value.name} - ${total.value.serviceDaysCount}`,
    status: "publish",
    tags: [8],
    meta: {
      full_name: formData.value.name,
      phone: formData.value.phone,
      salary: formData.value.salary,
      startServiceDate: formData.value.startServiceDate,
      endServiceDate: formData.value.endServiceDate,
      serviceStatus: formData.value.serviceStatus,
      terminatedService: formData.value.terminatedService,
      paidDays: formData.value.paidDays,
      unpaidDays: formData.value.unpaidDays,
      remember: formData.value.remember,
      serviceDaysCount: total.value.serviceDaysCount,
      offDaysCount: total.value.offDaysCount,
      endDaysCount: total.value.endDaysCount,
      dayRate: total.value.dayRate,
      endDaysTotal: total.value.endDaysTotal,
    }
  }
  const endpoint = lastPostId.value > 0 ? `haqiy/${lastPostId.value}` : 'haqiy';
  api.post(endpoint, requestData).then(resp => {
    lastPostId.value = resp.data.id;
    linkToShare.value = resp.data.link;
  }).catch(err => {
    console.log('err', err);
  })
}

const onDataChange = () => {
  if(total.value.serviceDaysCount && formData.value.salary && formData.value.phone) {
    return storeData();
  }
}

const onSubmit = () => {};

const sharing = {
  url: linkToShare.value,
  title: 'شاهد مستحقاتي من حقي.كوم',
  description: 'حساب نهاية الخدمة حسب قانون العمل الكويتي الاخير',
  hashtags: 'حقي_كوم,مستحقات_ماليه,حساب_مرتبات,حساب_نهايه_الخدمه',
}
const networks = [
  { network: 'whatsapp', name: 'Whatsapp', icon: 'fab fah fa-lg fa-whatsapp', color: '#25d366' },
  { network: 'linkedin', name: 'LinkedIn', icon: 'fab fah fa-lg fa-linkedin', color: '#007bb5' },
  { network: 'facebook', name: 'Facebook', icon: 'fab fah fa-lg fa-facebook-f', color: '#1877f2' },
  { network: 'twitter', name: 'Twitter', icon: 'fab fah fa-lg fa-twitter', color: '#1da1f2' },
  { network: 'messenger', name: 'Messenger', icon: 'fab fah fa-lg fa-facebook-messenger', color: '#0084ff' },
  { network: 'email', name: 'Email', icon: 'far fah fa-lg fa-envelope', color: '#333333' },
  { network: 'evernote', name: 'Evernote', icon: 'fab fah fa-lg fa-evernote', color: '#2dbe60' },
  { network: 'line', name: 'Line', icon: 'fab fah fa-lg fa-line', color: '#00c300' },
  { network: 'quora', name: 'Quora', icon: 'fab fah fa-lg fa-quora', color: '#a82400' },
  { network: 'reddit', name: 'Reddit', icon: 'fab fah fa-lg fa-reddit-alien', color: '#ff4500' },
  { network: 'skype', name: 'Skype', icon: 'fab fah fa-lg fa-skype', color: '#00aff0' },
  { network: 'sms', name: 'SMS', icon: 'far fah fa-lg fa-comment-dots', color: '#333333' },
  { network: 'telegram', name: 'Telegram', icon: 'fab fah fa-lg fa-telegram-plane', color: '#0088cc' },
  { network: 'viber', name: 'Viber', icon: 'fab fah fa-lg fa-viber', color: '#59267c' },
]
</script>

<template>
  <div class="container">
    <div class="calc-wrapper">
      <div class="calc-container vertical">
        <div class="calc-fields calc-list calc-list__indexed loaded">
          <Form @submit="onSubmit" :validation-schema="formSchema">
            <div class="calc-list-inner">
              <div class="calc-fields-container">
                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-item__title">
                    <span> {{ $t("name") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <Field
                        name="name"
                        type="text"
                        class="calc-input number ccb-field ccb-appearance-field"
                        v-model="formData.name"
                        @change="onDataChange"
                    />
                  </div>
                  <ErrorMessage name="name" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-item__title">
                    <span> {{ $t("phone") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <Field
                        name="phone"
                        type="tel"
                        class="calc-input number ccb-field ccb-appearance-field"
                        v-model="formData.phone"
                        pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}"
                        @change="onDataChange"
                    />
                  </div>
                  <ErrorMessage name="phone" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-checkbox">
                    <div class="calc-checkbox-item">
                      <Field
                          name="remember"
                          type="checkbox"
                          id="rememberMe"
                          value="0_1"
                          class="calc-input number ccb-field ccb-appearance-field"
                          v-model="formData.remember"
                          @change="onDataChange"
                      />
                      <label for="rememberMe">
                          <span>
                            <span class="calc-checkbox-title">{{$t('remember')}}</span>
                          </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-item__title">
                    <span> {{ $t("startServiceDate") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <VueDatePicker v-model="formData.startServiceDate" :locale="currentLocale" :clearable="false" :enable-time-picker="false" auto-apply :day-names="weekDays"
                                   @update:model-value="onDataChange"></VueDatePicker>
                  </div>
                  <ErrorMessage name="startServiceDatery" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-item__title">
                    <span> {{ $t("endServiceDate") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <VueDatePicker v-model="formData.endServiceDate" :locale="currentLocale" :clearable="false" :enable-time-picker="false" auto-apply :day-names="weekDays"
                                   @update:model-value="onDataChange"></VueDatePicker>
                  </div>
                  <ErrorMessage name="endServiceDatery" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-item__title">
                    <span> {{ $t("salary") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <Field
                        name="salary"
                        type="number"
                        class="calc-input number ccb-field ccb-appearance-field"
                        v-model="formData.salary"
                        @change="onDataChange"
                    />
                  </div>
                  <ErrorMessage name="salary" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-item__title">
                    <span> {{ $t("serviceStatus") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <select name="serviceStatus" v-model="formData.serviceStatus" @change="onDataChange">
                      <option v-for="status in serviceStatus" :value="status.value" :key="status.value">
                        {{ status.name }}
                      </option>
                    </select>
                  </div>
                  <ErrorMessage name="serviceStatus" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity" v-if="formData.serviceStatus === 2">
                  <div class="calc-item__title">
                    <span> {{ $t("terminatedService") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <select name="terminatedService" v-model="formData.terminatedService" @change="onDataChange">
                      <option v-for="status in terminatedService" :value="status.value" :key="status.value">
                        {{ status.name }}
                      </option>
                    </select>
                  </div>
                  <ErrorMessage name="terminatedService" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity">
                  <div class="calc-checkbox">
                    <div class="calc-checkbox-item">
                      <Field
                          name="advanced"
                          type="checkbox"
                          id="showMoreOption"
                          value="0_1"
                          class="calc-input number ccb-field ccb-appearance-field"
                          v-model="formData.advanced"
                      />
                      <label for="showMoreOption">
                          <span>
                            <span class="calc-checkbox-title">{{$t('showAdvanced')}}</span>
                          </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="calc-item ccb-field ccb-field-quantity"  v-if="formData.advanced">
                  <div class="calc-item__title">
                    <span> {{ $t("unpaidDays") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <Field
                        name="unpaidDays"
                        type="number"
                        class="calc-input number ccb-field ccb-appearance-field"
                        v-model="formData.unpaidDays"
                        @change="onDataChange"
                    />
                  </div>
                  <ErrorMessage name="unpaidDays" />
                </div>

                <div class="calc-item ccb-field ccb-field-quantity"  v-if="formData.advanced">
                  <div class="calc-item__title">
                    <span> {{ $t("paidDays") }} </span>
                    <span class="ccb-required-mark">*</span>
                  </div>
                  <div class="calc-input-wrapper ccb-field">
                    <Field
                        name="paidDays"
                        type="number"
                        class="calc-input number ccb-field ccb-appearance-field"
                        v-model="formData.paidDays"
                        @change="onDataChange"
                    />
                  </div>
                  <ErrorMessage name="paidDays" />
                </div>
              </div>
            </div>
          </Form>

        </div>
        <div class="calc-subtotal calc-list loaded">
          <div class="calc-subtotal-wrapper" style="position: relative">
            <div class="calc-list-inner">
              <div class="calc-subtotal-list">
                <div class="calc-subtotal-list-accordion">
                  <div class="sub-list-item">
                    <span class="sub-item-title">{{ $t("name") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.name }}</span>
                  </div>
                  <div class="sub-list-item">
                    <span class="sub-item-title">{{ $t("phone") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.phone }}</span>
                  </div>
                  <div class="sub-list-item">
                    <span class="sub-item-title">{{ $t("endServiceDate") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.endServiceDate ? $filters.formatDate(formData.endServiceDate) : '' }}</span>
                  </div>
                  <div class="sub-list-item">
                    <span class="sub-item-title">{{ $t("salary") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.salary < 0 ? 0 : formData.salary }} {{ $t("kw") }}</span>
                  </div>
                  <div class="sub-list-item">
                    <span class="sub-item-title">{{ $t("serviceStatus") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.serviceStatus ? serviceStatus.find(s => s.value === formData.serviceStatus)?.name : '' }}</span>
                  </div>

                  <div class="sub-list-item" v-if="formData.serviceStatus === 2">
                    <span class="sub-item-title">{{ $t("terminatedService") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.terminatedService ? terminatedService.find(s => s.value === formData.terminatedService)?.name : '' }}</span>
                  </div>

                  <div class="sub-list-item" v-if="formData.advanced">
                    <span class="sub-item-title">{{ $t("unpaidDays") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.unpaidDays < 0 ? 0 : formData.unpaidDays }} {{ $t("day") }}</span>
                  </div>

                  <div class="sub-list-item" v-if="formData.advanced">
                    <span class="sub-item-title">{{ $t("paidDays") }}</span>
                    <span class="sub-item-space"></span>
                    <span class="sub-item-value">{{ formData.paidDays < 0 ? 0 : formData.paidDays }} {{ $t("day") }}</span>
                  </div>
                </div>
              </div>
              <div class="calc-subtotal-list total-list">
                <div class="sub-list-item total">
                  <span class="sub-item-title">{{ $t("serviceDaysCount") }}</span>
                  <span class="sub-item-value">{{total.serviceDaysCount ? total.serviceDaysCount : 0}} {{$t("day")}}</span>
                </div>

                <div class="sub-list-item total">
                  <span class="sub-item-title">{{ $t("offDaysCount") }}</span>
                  <span class="sub-item-value">{{total.offDaysCount}} {{$t("day")}}</span>
                </div>

                <div class="sub-list-item total">
                  <span class="sub-item-title">{{ $t("endDaysCount") }}</span>
                  <span class="sub-item-value">{{total.endDaysCount}} {{$t("day")}}</span>
                </div>

                <div class="sub-list-item total">
                  <span class="sub-item-title">{{ $t("dayRate") }}</span>
                  <span class="sub-item-value">{{total.dayRate ? total.dayRate : 0}} {{$t("kw")}}</span>
                </div>

                <div class="sub-list-item total">
                  <span class="sub-item-title">{{ $t("offDaysTotal") }}</span>
                  <span class="sub-item-value">{{total.offDaysTotal}} {{$t("kw")}}</span>
                </div>

                <div class="sub-list-item total">
                  <span class="sub-item-title">{{ $t("endDaysTotal") }}</span>
                  <span class="sub-item-value">{{total.endDaysTotal}} {{$t("kw")}}</span>
                </div>
              </div>
              <div class="calc-rights" v-html="copyright"></div>
            </div>
            <div class="share-network-outter" v-if="linkToShare">
              <h2>{{$t('share')}}</h2>
              <div class="share-network-list">
                <ShareNetwork
                    v-for="network in networks"
                    :network="network.network"
                    :key="network.network"
                    :style="{backgroundColor: network.color}"
                    :url="linkToShare"
                    :title="sharing.title"
                    :description="sharing.description"
                    :quote="sharing.quote"
                    :hashtags="sharing.hashtags"
                >
                  <i :class="network.icon"></i>
                  <!--                <span>{{ network.name }}</span>-->
                </ShareNetwork>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
main {
  margin: 0 auto;
}
</style>
