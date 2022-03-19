import {arg, commandType, IAsset, ISentence} from "../interface/scene";


/**
 * 语句解析器
 * @param sentenceRaw 原始语句
 */
export const scriptParser = (sentenceRaw: string): ISentence => {
    let command = commandType.say;//默认为对话
    let content: string = ''; //语句内容
    let subScene: string = ''; //语句携带的子场景（可能没有）
    const args: Array<arg> = [];//语句参数列表
    const sentenceAssets: Array<IAsset> = [];//语句携带的资源列表
    return {
        command: command, //语句类型
        content: content, //语句内容
        args: args, //参数列表
        sentenceAssets: sentenceAssets, //语句携带的资源列表
        subScene: subScene //语句携带的子场景
    }
}