import {
    createEntityAdapter,
    createSelector,
    createSlice,
    CaseReducer,
    Comparer,
    EntityId,
    EntitySelectors,
    EntityState as ReduxEntityState,
    PayloadAction,
    Update
} from '@reduxjs/toolkit';
import StatusEnum from '../../constants/StatusEnum';
import EntityState, { IEntityState } from '../../models/entity-state';
import { IMetaSliceSelectors, ISlice, ISliceSelectors } from '../../types';
import { getISOStringWithOffset, logSlice, mapErrorToSerializableObject } from '../../utilities';

/**
 * @public
 */
export type IEntitySliceReducers <TSliceState, TEntity, TStatusEnum, TError> = {
    addOne: CaseReducer<TSliceState, PayloadAction<TEntity>>;
    addMany: CaseReducer<TSliceState, PayloadAction<Array<TEntity> | Record<EntityId, TEntity>>>;
    hydrateOne: CaseReducer<TSliceState, PayloadAction<TEntity>>;
    hydrateMany: CaseReducer<TSliceState, PayloadAction<Array<TEntity> | Record<EntityId, TEntity>>>;
    hydrateAll: CaseReducer<TSliceState, PayloadAction<Array<TEntity> | Record<EntityId, TEntity>>>;
    updateOne: CaseReducer<TSliceState, PayloadAction<Update<TEntity>>>;
    updateMany: CaseReducer<TSliceState, PayloadAction<Array<Update<TEntity>>>>;
    upsertOne: CaseReducer<TSliceState, PayloadAction<TEntity>>;
    upsertMany: CaseReducer<TSliceState, PayloadAction<Array<TEntity> | Record<EntityId, TEntity>>>;
    removeOne: CaseReducer<TSliceState, PayloadAction<EntityId>>;
    removeMany: CaseReducer<TSliceState, PayloadAction<Array<EntityId>>>;
    removeAll: CaseReducer<TSliceState, PayloadAction>;
    reset: CaseReducer<TSliceState, PayloadAction>;
    setAll: CaseReducer<TSliceState, PayloadAction<Array<TEntity> | Record<EntityId, TEntity>>>;
    setStatus: CaseReducer<TSliceState, PayloadAction<TStatusEnum>>;
    setError: CaseReducer<TSliceState, PayloadAction<TError | null>>;
}

/**
 * @public
 */
export interface IEntitySliceSelectors<
    TGlobalState,
    TEntity,
    TStatusEnum extends keyof typeof StatusEnum | & string = keyof typeof StatusEnum,
    TError extends Error = Error
    >
    extends
        EntitySelectors<TEntity, TGlobalState>,
        ISliceSelectors<TGlobalState, IEntityState<TEntity, TStatusEnum, TError>>,
        IMetaSliceSelectors<TGlobalState, TStatusEnum, TError> {
}

/**
 * @public
 */
export type IEntitySlice<
    TGlobalState,
    TEntity,
    TStatusEnum extends keyof typeof StatusEnum | & string = keyof typeof StatusEnum,
    TError extends Error = Error
    > = ISlice<
        TGlobalState,
        IEntityState<TEntity, TStatusEnum, TError>,
        IEntitySliceReducers<IEntityState<TEntity, TStatusEnum, TError>, TEntity, TStatusEnum, TError>,
        IEntitySliceSelectors<TGlobalState, TEntity, TStatusEnum, TError>
        >

/**
 * @public
 */
export interface ICreateEntitySliceOptions<
    TGlobalState,
    TEntity,
    TStatusEnum extends keyof typeof StatusEnum | & string = keyof typeof StatusEnum,
    TError extends Error = Error
    > {
    name: string;
    selectSliceState: (state: TGlobalState) => IEntityState<TEntity, TStatusEnum, TError>;
    selectId: (o: TEntity) => EntityId;
    sortComparer: false | Comparer<TEntity>;
    initialState?: Partial<IEntityState<TEntity, TStatusEnum, TError>>;
    debug?: boolean;
}

/**
 * @public
 */
function createEntitySlice<
    TGlobalState,
    TEntity,
    TStatusEnum extends keyof typeof StatusEnum | & string = keyof typeof StatusEnum,
    TError extends Error = Error
    >(options: ICreateEntitySliceOptions<TGlobalState, TEntity, TStatusEnum, TError>): IEntitySlice<TGlobalState, TEntity, TStatusEnum, TError> {
    type ISliceState = IEntityState<TEntity, TStatusEnum, TError>

    const { name, selectSliceState, selectId, sortComparer, initialState, debug } = options;

    const selectEntityState = (state: ISliceState): ReduxEntityState<TEntity> => ({
        ids: state.ids,
        entities: state.entities
    });

    // intentional, necessary with immer
    /* eslint-disable no-param-reassign */
    const setEntityState = (state: ISliceState, entityState: ReduxEntityState<TEntity>) => {
        state.ids = entityState.ids;
        state.entities = entityState.entities;
    };

    const setError = (state: ISliceState, error: TError | null) => {
        state.error = error === null ? null : mapErrorToSerializableObject(error) as TError;
    };

    const setStatus = (state: ISliceState, status: TStatusEnum) => {
        state.status = status;
    };

    const setLastModified = (state: ISliceState, lastModified: string | null) => {
        state.lastModified = lastModified;
    };

    const setLastHydrated = (state: ISliceState, lastHydrated: string | null) => {
        state.lastHydrated = lastHydrated;
    };
    /* eslint-enable no-param-reassign */

    const modifyState = (state: ISliceState, entityState: ReduxEntityState<TEntity>) => {
        setEntityState(state, entityState);
        // TODO: should not have a side effect: https://redux.js.org/style-guide/style-guide#reducers-must-not-have-side-effects
        setLastModified(state, getISOStringWithOffset());
    };

    const hydrateState = (state: ISliceState, entityState: ReduxEntityState<TEntity>) => {
        setEntityState(state, entityState);
        setLastModified(state, null);
        // TODO: should not have a side effect: https://redux.js.org/style-guide/style-guide#reducers-must-not-have-side-effects
        setLastHydrated(state, getISOStringWithOffset());
    };

    const entityAdapter = createEntityAdapter({
        selectId: selectId,
        sortComparer: sortComparer
    });

    const initialEntityState = entityAdapter.getInitialState(initialState ?? {});
    const initialSliceState = EntityState.create<TEntity, TStatusEnum, TError>(initialEntityState);

    const slice = createSlice<ISliceState, IEntitySliceReducers<ISliceState, TEntity, TStatusEnum, TError>>({
        name: name,
        initialState: initialSliceState,
        reducers: {
            addOne: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.addOne(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            addMany: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.addMany(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            hydrateOne: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.upsertOne(entityState, action.payload);
                hydrateState(state as ISliceState, newEntityState);
            },
            hydrateMany: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.upsertMany(entityState, action.payload);
                hydrateState(state as ISliceState, newEntityState);
            },
            hydrateAll: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.setAll(entityState, action.payload);
                hydrateState(state as ISliceState, newEntityState);
            },
            updateOne: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.updateOne(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            updateMany: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.updateMany(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            upsertOne: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.upsertOne(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            upsertMany: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.upsertMany(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            removeOne: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.removeOne(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            removeMany: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.removeMany(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            removeAll: (state) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.removeAll(entityState);
                modifyState(state as ISliceState, newEntityState);
            },
            reset: () => initialSliceState,
            setAll: (state, action) => {
                const entityState = selectEntityState(state as ISliceState);
                const newEntityState = entityAdapter.setAll(entityState, action.payload);
                modifyState(state as ISliceState, newEntityState);
            },
            setError: (state, action) => {
                setError(state as ISliceState, action.payload);
            },
            setStatus: (state, action) => {
                setStatus(state as ISliceState, action.payload);
            }
        }
    });

    const entitySelectors = entityAdapter.getSelectors((state: TGlobalState) => selectEntityState(selectSliceState(state)));

    const selectors = {
        selectIds: entitySelectors.selectIds,
        selectEntities: entitySelectors.selectEntities,
        selectAll: entitySelectors.selectAll,
        selectTotal: entitySelectors.selectTotal,
        selectById: entitySelectors.selectById,
        selectSliceState: createSelector(selectSliceState, (sliceState) => sliceState),
        selectStatus: createSelector(selectSliceState, (sliceState) => sliceState.status),
        selectError: createSelector(selectSliceState, (sliceState) => sliceState.error),
        selectLastModified: createSelector(selectSliceState, (sliceState) => sliceState.lastModified),
        selectLastHydrated: createSelector(selectSliceState, (sliceState) => sliceState.lastHydrated)
    };

    const entitySlice: IEntitySlice<TGlobalState, TEntity, TStatusEnum, TError> = {
        name: slice.name,
        reducer: slice.reducer,
        actions: slice.actions,
        selectors: selectors
    };

    if (debug) {
        logSlice(entitySlice, initialSliceState);
    }

    return entitySlice;
}

export default createEntitySlice;
