import { FC, useEffect } from 'react';
import styles from './title.module.scss';
import { playBgm } from '@/Core/controller/stage/playBgm';
import { continueGame, startGame } from '@/Core/controller/gamePlay/startContinueGame';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, webgalStore } from '@/store/store';
import { setMenuPanelTag, setVisibility } from '@/store/GUIReducer';
import { MenuPanelTag } from '@/store/guiInterface';
import useTrans from '@/hooks/useTrans';
// import { resize } from '@/Core/util/resize';
import { hasFastSaveRecord, loadFastSaveGame } from '@/Core/controller/storage/fastSaveLoad';
import useSoundEffect from '@/hooks/useSoundEffect';
import useApplyStyle from '@/hooks/useApplyStyle';
import { fullScreenOption } from '@/store/userDataInterface';
import { keyboard } from '@/hooks/useHotkey';
import useConfigData from '@/hooks/useConfigData';
import { __INFO } from '@/config/info';

/**
 * 标题页
 * @constructor
 */
const Title: FC = () => {
  const userDataState = useSelector((state: RootState) => state.userData);
  const GUIState = useSelector((state: RootState) => state.GUI);
  const dispatch = useDispatch();
  const fullScreen = userDataState.optionData.fullScreen;
  const background = GUIState.titleBg;
  const showBackground = background === '' ? 'rgba(0,0,0,1)' : `url("${background}")`;
  const t = useTrans('title.');
  const { playSeEnter, playSeClick } = useSoundEffect();

  const applyStyle = useApplyStyle('UI/Title/title.scss');
  useConfigData(); // 监听基础ConfigData变化

  const appreciationItems = useSelector((state: RootState) => state.userData.appreciationData);
  const hasAppreciationItems = appreciationItems.bgm.length > 0 || appreciationItems.cg.length > 0;

  return (
    <>
      {GUIState.showTitle && <div className={applyStyle('Title_backup_background', styles.Title_backup_background)} />}
      <div
        id="enter_game_target"
        onClick={() => {
          playBgm(GUIState.titleBgm);
          dispatch(setVisibility({ component: 'isEnterGame', visibility: true }));
          if (fullScreen === fullScreenOption.on) {
            document.documentElement.requestFullscreen();
            if (keyboard) keyboard.lock(['Escape', 'F11']);
          }
        }}
        onMouseEnter={playSeEnter}
      />
      {GUIState.showTitle && (
        <div
          className={applyStyle('Title_main', styles.Title_main)}
          style={{
            backgroundImage: showBackground,
            backgroundSize: 'cover',
          }}
        >
          <div className={applyStyle('Title_buttonList', styles.Title_buttonList)}>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={() => {
                startGame();
                playSeClick();
              }}
              onMouseEnter={playSeEnter}
            >
              <div
                className={applyStyle('Title_button_text', styles.Title_button_text)}
                data-content={t('start.title')}
              >
                {t('start.title')}
              </div>
            </div>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={async () => {
                playSeClick();
                dispatch(setVisibility({ component: 'showTitle', visibility: false }));
                continueGame();
              }}
              onMouseEnter={playSeEnter}
            >
              <div
                className={applyStyle('Title_button_text', styles.Title_button_text)}
                data-content={t('continue.title')}
              >
                {t('continue.title')}
              </div>
            </div>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={() => {
                playSeClick();
                dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
                dispatch(setMenuPanelTag(MenuPanelTag.Option));
              }}
              onMouseEnter={playSeEnter}
            >
              <div
                className={applyStyle('Title_button_text', styles.Title_button_text)}
                data-content={t('options.title')}
              >
                {t('options.title')}
              </div>
            </div>
            <div
              className={applyStyle('Title_button', styles.Title_button)}
              onClick={() => {
                playSeClick();
                dispatch(setVisibility({ component: 'showMenuPanel', visibility: true }));
                dispatch(setMenuPanelTag(MenuPanelTag.Load));
              }}
              onMouseEnter={playSeEnter}
            >
              <div className={applyStyle('Title_button_text', styles.Title_button_text)} data-content={t('load.title')}>
                {t('load.title')}
              </div>
            </div>
            {GUIState.enableAppreciationMode && (
              <div
                className={`${applyStyle('Title_button', styles.Title_button)} ${
                  !hasAppreciationItems ? styles.Title_button_disabled : ''
                }`}
                onClick={() => {
                  if (hasAppreciationItems) {
                    playSeClick();
                    dispatch(setVisibility({ component: 'showExtra', visibility: true }));
                  }
                }}
                onMouseEnter={playSeEnter}
              >
                <div
                  className={applyStyle('Title_button_text', styles.Title_button_text)}
                  data-content={t('extra.title')}
                >
                  {t('extra.title')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {GUIState.showTitle && (
        <div className={styles.Title_version_info}>
          <div>WebGAL Bandori Craft Engine v1.0.0</div>
          <div>(Based on WebGAL v{__INFO.version})</div>
        </div>
      )}
    </>
  );
};

export default Title;
