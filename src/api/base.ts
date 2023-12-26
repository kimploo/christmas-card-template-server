import axios from 'axios';

const kakaoAxios = axios.create({});
kakaoAxios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';

export default kakaoAxios;
