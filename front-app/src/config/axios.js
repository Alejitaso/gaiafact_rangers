import axios from "axios";

const ClientesAxios = axios.create({
    baseURL: 'http://localhost:4000/api/Usuario'
});

export default ClientesAxios;