import { type $Fetch } from "ofetch";
declare const _default: any;
export default _default;
declare module "#app" {
    interface NuxtApp {
        $authFetch: $Fetch;
    }
}
