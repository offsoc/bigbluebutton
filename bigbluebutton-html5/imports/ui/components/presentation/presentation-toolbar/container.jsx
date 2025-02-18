import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import FullscreenService from '/imports/ui/components/common/fullscreen-button/service';
import { useIsPollingEnabled } from '/imports/ui/services/features';
import { PluginsContext } from '/imports/ui/components/components-data/plugin-context/context';
import { POLL_CANCEL, POLL_CREATE } from '/imports/ui/components/poll/mutations';
import { PRESENTATION_SET_PAGE } from '../mutations';
import PresentationToolbar from './component';
import Session from '/imports/ui/services/storage/in-memory';

const PresentationToolbarContainer = (props) => {
  const pluginsContext = useContext(PluginsContext);
  const { pluginsExtensibleAreasAggregatedState } = pluginsContext;

  const {
    userIsPresenter,
    layoutSwapped,
    currentSlideNum,
    presentationId,
    numberOfSlides,
    hasPoll,
  } = props;

  const handleToggleFullScreen = (ref) => FullscreenService.toggleFullScreen(ref);

  const [stopPoll] = useMutation(POLL_CANCEL);
  const [createPoll] = useMutation(POLL_CREATE);
  const [presentationSetPage] = useMutation(PRESENTATION_SET_PAGE);

  const endCurrentPoll = () => {
    if (hasPoll) stopPoll();
  };

  const setPresentationPage = (pageId) => {
    presentationSetPage({
      variables: {
        presentationId,
        pageId,
      },
    });
  };

  const skipToSlide = (slideNum) => {
    const slideId = `${presentationId}/${slideNum}`;
    setPresentationPage(slideId);
  };

  const previousSlide = () => {
    const prevSlideNum = currentSlideNum - 1;
    if (prevSlideNum < 1) {
      return;
    }
    skipToSlide(prevSlideNum);
  };

  const nextSlide = () => {
    const nextSlideNum = currentSlideNum + 1;
    if (nextSlideNum > numberOfSlides) {
      return;
    }
    skipToSlide(nextSlideNum);
  };

  const startPoll = (pollType, pollId, answers = [], question, isMultipleResponse = false) => {
    Session.setItem('openPanel', 'poll');
    Session.setItem('forcePollOpen', true);
    window.dispatchEvent(new Event('panelChanged'));

    createPoll({
      variables: {
        pollType,
        pollId: `${pollId}/${new Date().getTime()}`,
        secretPoll: false,
        question,
        isMultipleResponse,
        answers,
      },
    });
  };

  const isPollingEnabled = useIsPollingEnabled();

  if (userIsPresenter && !layoutSwapped) {
    // Only show controls if user is presenter and layout isn't swapped

    const pluginProvidedPresentationToolbarItems = pluginsExtensibleAreasAggregatedState
      ?.presentationToolbarItems;

    return (
      <PresentationToolbar
        {...props}
        amIPresenter={userIsPresenter}
        endCurrentPoll={endCurrentPoll}
        isPollingEnabled={isPollingEnabled}
        // TODO: Remove this
        isMeteorConnected
        {...{
          pluginProvidedPresentationToolbarItems,
          handleToggleFullScreen,
          startPoll,
          previousSlide,
          nextSlide,
          skipToSlide,
        }}
      />
    );
  }
  return null;
};

export default PresentationToolbarContainer;

PresentationToolbarContainer.propTypes = {
  // Number of current slide being displayed
  currentSlideNum: PropTypes.number.isRequired,

  // Total number of slides in this presentation
  numberOfSlides: PropTypes.number.isRequired,

  // Actions required for the presenter toolbar
  layoutSwapped: PropTypes.bool,
};
