import AsyncStorage from "@react-native-async-storage/async-storage";

export const getToken = async () => {
    return await AsyncStorage.getItem("authToken");
};

export const setToken = async (token: string) => {
    return await AsyncStorage.setItem("authToken", token);
};

export const clearToken = async () => {
    return await AsyncStorage.removeItem("authToken");
};
