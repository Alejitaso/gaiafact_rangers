import axios from "axios";

const ClientesAxios = axios.create({
    baseURL: 'http://localhost:4000/', // Asegúrate de que esta URL coincida con la del servidor backend
});

export default ClientesAxios;