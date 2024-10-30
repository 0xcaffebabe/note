
export function cloneDeep(obj: any) {
    return JSON.parse(JSON.stringify(obj))
}