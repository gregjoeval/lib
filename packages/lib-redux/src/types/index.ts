import { CaseReducerActions, Reducer, SliceCaseReducers } from '@reduxjs/toolkit';
import StateStatusEnum from '../constants/StateStatusEnum';

export interface ISlice <
    TGlobalState,
    TSliceState,
    TCaseReducers extends SliceCaseReducers<TSliceState>,
    TSliceSelectors extends ISliceSelectors<TGlobalState, TSliceState>
    > {
    name: string;
    reducer: Reducer<TSliceState>;
    actions: CaseReducerActions<TCaseReducers>;
    selectors: TSliceSelectors;
}

export interface ISliceSelectors<
    TGlobalState,
    TSliceState
    > {
    selectSliceState: (state: TGlobalState) => TSliceState;
}

export interface IMetaSliceSelectors<
    TGlobalState,
    TStatusEnum extends keyof typeof StateStatusEnum = keyof typeof StateStatusEnum, // TODO: will need this
    TError extends Error = Error // TODO: will need this
    > {
    selectStatus: (state: TGlobalState) => TStatusEnum;
    selectError: (state: TGlobalState) => TError | null;
    selectLastModified: (state: TGlobalState) => string | null;
    selectLastHydrated: (state: TGlobalState) => string | null;
}
