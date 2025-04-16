import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { IPerform } from '@/Core/Modules/perform/performInterface';
import { webgalStore } from '@/store/store';
import { setStage, stageActions } from '@/store/stageReducer';
import cloneDeep from 'lodash/cloneDeep';
import { getSentenceArgByKey } from '@/Core/util/getSentenceArg';
import { IFreeFigure, IStageState, ITransform, IPosition } from '@/store/stageInterface';
import { IUserAnimation } from '@/Core/Modules/animations';
import { generateTransformAnimationObj } from '@/Core/controller/stage/pixi/animations/generateTransformAnimationObj';
import { assetSetter, fileType } from '@/Core/util/gameAssetsAccess/assetSetter';
import { logger } from '@/Core/util/logger';
import { getAnimateDuration } from '@/Core/Modules/animationFunctions';
import { WebGAL } from '@/Core/WebGAL';
/**
 * 更改立绘
 * @param sentence 语句
 */
// eslint-disable-next-line complexity
export function changeFigure(sentence: ISentence): IPerform {
  // 根据参数设置指定位置
  let pos: IPosition = 'center';
  let content = sentence.content;
  let isFreeFigure = false;
  let motion = '';
  let expression = '';
  let key = '';
  let duration = 500;
  let mouthOpen = '';
  let mouthClose = '';
  let mouthHalfOpen = '';
  let eyesOpen = '';
  let eyesClose = '';
  let animationFlag: any = '';
  let mouthAnimationKey: any = 'mouthAnimation';
  let eyesAnimationKey: any = 'blinkAnimation';
  let overrideBounds = '';
  let zIndex = -1;
  const dispatch = webgalStore.dispatch;

  for (const e of sentence.args) {
    switch (e.key) {
      case 'left':
        if (e.value === true) {
          pos = 'left';
          mouthAnimationKey = 'mouthAnimationLeft';
          eyesAnimationKey = 'blinkAnimationLeft';
        }
        break;
      case 'right':
        if (e.value === true) {
          pos = 'right';
          mouthAnimationKey = 'mouthAnimationRight';
          eyesAnimationKey = 'blinkAnimationRight';
        }
        break;
      case 'far-left':
        if (e.value === true) {
          pos = 'far-left';
        }
        break;
      case 'far-right':
        if (e.value === true) {
          pos = 'far-right';
        }
        break;
      case 'clear':
        if (e.value === true) {
          content = '';
        }
        break;
      case 'id':
        isFreeFigure = true;
        key = e.value.toString();
        break;
      case 'motion':
        motion = e.value.toString();
        break;
      case 'bounds':
        overrideBounds = String(e.value);
        break;
      case 'expression':
        expression = e.value.toString();
        break;
      case 'mouthOpen':
        mouthOpen = e.value.toString();
        mouthOpen = assetSetter(mouthOpen, fileType.figure);
        break;
      case 'mouthClose':
        mouthClose = e.value.toString();
        mouthClose = assetSetter(mouthClose, fileType.figure);
        break;
      case 'mouthHalfOpen':
        mouthHalfOpen = e.value.toString();
        mouthHalfOpen = assetSetter(mouthHalfOpen, fileType.figure);
        break;
      case 'eyesOpen':
        eyesOpen = e.value.toString();
        eyesOpen = assetSetter(eyesOpen, fileType.figure);
        break;
      case 'eyesClose':
        eyesClose = e.value.toString();
        eyesClose = assetSetter(eyesClose, fileType.figure);
        break;
      case 'animationFlag':
        animationFlag = e.value.toString();
        break;
      case 'none':
        content = '';
        break;
      case 'zIndex':
        zIndex = Number(e.value);
        break;
      default:
        break;
    }
  }

  const id = key ? key : `fig-${pos}`;

  const currentFigureAssociatedAnimation = webgalStore.getState().stage.figureAssociatedAnimation;
  const filteredFigureAssociatedAnimation = currentFigureAssociatedAnimation.filter((item) => item.targetId !== id);
  const newFigureAssociatedAnimationItem = {
    targetId: id,
    animationFlag: animationFlag,
    mouthAnimation: {
      open: mouthOpen,
      close: mouthClose,
      halfOpen: mouthHalfOpen,
    },
    blinkAnimation: {
      open: eyesOpen,
      close: eyesClose,
    },
  };
  filteredFigureAssociatedAnimation.push(newFigureAssociatedAnimationItem);
  dispatch(setStage({ key: 'figureAssociatedAnimation', value: filteredFigureAssociatedAnimation }));

  /**
   * 如果 url 没变，不移除
   */
  let isRemoveEffects = true;
  if (key !== '') {
    const figWithKey = webgalStore.getState().stage.freeFigure.find((e) => e.key === key);
    if (figWithKey) {
      if (figWithKey.name === sentence.content) {
        isRemoveEffects = false;
      }
    }
  } else {
    if (pos === 'center' && webgalStore.getState().stage.figName === sentence.content) {
      isRemoveEffects = false;
    } else if (pos === 'left' && webgalStore.getState().stage.figNameLeft === sentence.content) {
      isRemoveEffects = false;
    } else if (pos === 'right' && webgalStore.getState().stage.figNameRight === sentence.content) {
      isRemoveEffects = false;
    } else if (pos === 'far-left' && webgalStore.getState().stage.figNameFarLeft === sentence.content) {
      isRemoveEffects = false;
    } else if (pos === 'far-right' && webgalStore.getState().stage.figNameFarRight === sentence.content) {
      isRemoveEffects = false;
    }
  }
  /**
   * 处理 Effects
   */
  if (isRemoveEffects) {
    const deleteKey = `fig-${pos}`;
    const deleteKey2 = `${key}`;
    webgalStore.dispatch(stageActions.removeEffectByTargetId(deleteKey));
    webgalStore.dispatch(stageActions.removeEffectByTargetId(deleteKey2));
    // 重设 figureMetaData，这里是 zIndex，实际上任何键都可以，因为整体是移除那条记录
    dispatch(stageActions.setFigureMetaData([deleteKey, 'zIndex', 0, true]));
    dispatch(stageActions.setFigureMetaData([deleteKey2, 'zIndex', 0, true]));
  }
  const setAnimationNames = (key: string, sentence: ISentence) => {
    // 处理 transform 和 默认 transform
    const transformString = getSentenceArgByKey(sentence, 'transform') ?? '';
    const durationFromArg = getSentenceArgByKey(sentence, 'duration');
    if (durationFromArg && typeof durationFromArg === 'number') {
      duration = durationFromArg;
    }
    let animationObj: (ITransform & {
      duration: number;
    })[];
    try {
      const frame = JSON.parse(transformString.toString()) as ITransform & { duration: number };
      applyTransform(pos, frame);
    } catch (e) {
      // 解析都错误了，歇逼吧
      applyTransform(pos);
    }

    function applyTransform(pos: IPosition = 'center', transformFrame?: ITransform & { duration: number }) {
      let frame = {} as unknown as ITransform & {
        duration: number;
      };
      if (sentence.content.endsWith('.json')) {
        const positionXMap: Record<IPosition, number> = {
          center: 220,
          left: -200,
          'far-left': -500,
          right: 640,
          'far-right': 940,
        };
        frame = {
          position: { x: positionXMap[pos], y: -190 },
          scale: { x: 0.83, y: 0.83 },
        } as unknown as ITransform & {
          duration: number;
        };
        if (transformFrame) {
          frame.position.x += transformFrame.position.x;
          frame.position.y += transformFrame.position.y;
          frame.scale.x *= transformFrame.scale.x;
          frame.scale.y *= transformFrame.scale.y;
        }
      }
      animationObj = generateTransformAnimationObj(key, frame, duration);
      // 因为是切换，必须把一开始的 alpha 改为 0
      animationObj[0].alpha = 0;
      const animationName = (Math.random() * 10).toString(16);
      const newAnimation: IUserAnimation = { name: animationName, effects: animationObj };
      WebGAL.animationManager.addAnimation(newAnimation);
      duration = getAnimateDuration(animationName);
      WebGAL.animationManager.nextEnterAnimationName.set(key, animationName);
    }

    const enterAnim = getSentenceArgByKey(sentence, 'enter');
    const exitAnim = getSentenceArgByKey(sentence, 'exit');
    if (enterAnim) {
      WebGAL.animationManager.nextEnterAnimationName.set(key, enterAnim.toString());
      duration = getAnimateDuration(enterAnim.toString());
    }
    if (exitAnim) {
      WebGAL.animationManager.nextExitAnimationName.set(key + '-off', exitAnim.toString());
      duration = getAnimateDuration(exitAnim.toString());
    }
  };
  if (isFreeFigure) {
    /**
     * 下面的代码是设置自由立绘的
     */
    const freeFigureItem: IFreeFigure = { key, name: content, basePosition: pos };
    setAnimationNames(key, sentence);
    if (motion || overrideBounds) {
      dispatch(
        stageActions.setLive2dMotion({ target: key, motion, overrideBounds: getOverrideBoundsArr(overrideBounds) }),
      );
    }
    if (expression) {
      dispatch(stageActions.setLive2dExpression({ target: key, expression }));
    }
    if (zIndex > 0) {
      dispatch(stageActions.setFigureMetaData([key, 'zIndex', zIndex, false]));
    }
    dispatch(stageActions.setFreeFigureByKey(freeFigureItem));
  } else {
    /**
     * 下面的代码是设置与位置关联的立绘的
     */
    const positionMap = {
      center: 'fig-center',
      left: 'fig-left',
      right: 'fig-right',
      'far-left': 'fig-far-left',
      'far-right': 'fig-far-right',
    };
    const dispatchMap: Record<string, keyof IStageState> = {
      center: 'figName',
      left: 'figNameLeft',
      right: 'figNameRight',
      'far-left': 'figNameFarLeft',
      'far-right': 'figNameFarRight',
    };

    key = positionMap[pos];
    setAnimationNames(key, sentence);
    if (motion || overrideBounds) {
      dispatch(
        stageActions.setLive2dMotion({ target: key, motion, overrideBounds: getOverrideBoundsArr(overrideBounds) }),
      );
    }
    if (expression) {
      dispatch(stageActions.setLive2dExpression({ target: key, expression }));
    }
    if (zIndex > 0) {
      dispatch(stageActions.setFigureMetaData([key, 'zIndex', zIndex, false]));
    }
    dispatch(setStage({ key: dispatchMap[pos], value: content }));
  }

  return {
    performName: 'none',
    duration,
    isHoldOn: false,
    stopFunction: () => {},
    blockingNext: () => false,
    blockingAuto: () => false,
    stopTimeout: undefined, // 暂时不用，后面会交给自动清除
  };
}

function getOverrideBoundsArr(raw: string): undefined | [number, number, number, number] {
  const parseOverrideBoundsResult = raw.split(',').map((e) => Number(e));
  let isPass = true;
  parseOverrideBoundsResult.forEach((e) => {
    if (isNaN(e)) {
      isPass = false;
    }
  });
  isPass = isPass && parseOverrideBoundsResult.length === 4;
  if (isPass) return parseOverrideBoundsResult as [number, number, number, number];
  else return undefined;
}
