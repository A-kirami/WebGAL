import {IAsset, IScene, ISentence} from "../interface/scene";
import {scriptParser} from "./scriptParser/scriptParser";
import {assetsPrefetcher} from "../util/assetsPrefetcher";
import {scenePrefetcher} from "../util/scenePrefetcher";


/**
 * 场景解析器
 * @param rawScene 原始场景
 * @param sceneName 场景名称
 * @param sceneUrl 场景url
 */
export const sceneParser = (rawScene: string, sceneName: string, sceneUrl: string): IScene => {
    const rawSentenceList = rawScene.split('\n');//原始句子列表
    let assetsList: Array<IAsset> = [];//场景资源列表
    let subSceneList: Array<string> = [];//子场景列表
    const sentenceList: Array<ISentence> = rawSentenceList.map(sentence => {
        const returnSentence: ISentence = scriptParser(sentence);
        //在这里解析出语句可能携带的资源和场景，合并到 assetsList 和 subSceneList
        assetsList = [...assetsList, ...returnSentence.sentenceAssets];
        subSceneList = [...subSceneList, returnSentence.subScene];
        return returnSentence;
    });
    //开始资源的预加载
    assetsPrefetcher(assetsList);
    //开始场景的预加载
    scenePrefetcher(subSceneList);
    return {
        sceneName: sceneName, //场景名称
        sceneUrl: sceneUrl,
        sentenceList: sentenceList, //语句列表
        assetsList: assetsList, //资源列表
        subSceneList: subSceneList  //子场景列表
    };
}