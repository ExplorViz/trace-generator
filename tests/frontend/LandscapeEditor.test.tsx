/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CleanedLandscape, CleanedPackage } from '../../src/backend/shared/types';
import { LandscapeEditor } from '../../src/frontend/components/LandscapeEditor';

describe('LandscapeEditor - Add Package', () => {
  let mockOnLandscapeUpdated: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;
  let mockPrompt: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnLandscapeUpdated = vi.fn();
    mockOnError = vi.fn();
    mockPrompt = vi.fn();
    // Mock window.prompt
    global.prompt = mockPrompt as unknown as typeof prompt;
  });

  const createMockApp = (name: string, rootPackage?: CleanedPackage): CleanedLandscape => {
    const defaultRootPackage: CleanedPackage = {
      name: 'org',
      classes: [],
      subpackages: [
        {
          name: 'tracegenerator',
          classes: [],
          subpackages: [],
        },
      ],
    };

    return {
      name,
      rootPackages: rootPackage ? [rootPackage] : [defaultRootPackage],
      entryPointFqn: `org.tracegenerator.${name}.Main`,
      classes: [],
      packages: rootPackage ? [rootPackage] : [defaultRootPackage],
      methods: [],
    };
  };

  it('should add a root package to an application when addRootPackage is called', async () => {
    const app = createMockApp('TestApp');
    const initialLandscape: CleanedLandscape[] = [app];

    // Mock prompt to return a package name
    mockPrompt.mockReturnValue('newpackage');

    render(
      <LandscapeEditor
        landscape={initialLandscape}
        onLandscapeUpdated={mockOnLandscapeUpdated as (landscape: CleanedLandscape[]) => void}
        onError={mockOnError as (error: string) => void}
      />
    );

    // Find and click the "Add Root Package" button
    const addRootPackageButton = screen.getByTitle('Add Root Package');
    fireEvent.click(addRootPackageButton);

    // Wait for the landscape to be updated
    await waitFor(() => {
      expect(mockOnLandscapeUpdated).toHaveBeenCalled();
    });

    // Verify the updated landscape contains the new package
    const updatedLandscape = mockOnLandscapeUpdated.mock.calls[0][0];
    expect(updatedLandscape).toHaveLength(1);
    expect(updatedLandscape[0].name).toBe('TestApp');

    // Verify the new package is in the rootPackages array
    const rootPackages = updatedLandscape[0].rootPackages;
    const newPackage = rootPackages.find((pkg) => pkg.name === 'newpackage');
    expect(newPackage).toBeDefined();
    expect(newPackage?.name).toBe('newpackage');
    expect(newPackage?.classes).toEqual([]);
    expect(newPackage?.subpackages).toEqual([]);
  });

  it('should add a root package to the rootPackages array', async () => {
    const app = createMockApp('TestApp');
    const initialLandscape: CleanedLandscape[] = [app];

    // Mock prompt to return a package name
    mockPrompt.mockReturnValue('rootpackage');

    render(
      <LandscapeEditor
        landscape={initialLandscape}
        onLandscapeUpdated={mockOnLandscapeUpdated as (landscape: CleanedLandscape[]) => void}
        onError={mockOnError as (error: string) => void}
      />
    );

    // Find and click the "Add Root Package" button
    const addRootPackageButton = screen.getByTitle('Add Root Package');
    fireEvent.click(addRootPackageButton);

    // Wait for the landscape to be updated
    await waitFor(() => {
      expect(mockOnLandscapeUpdated).toHaveBeenCalled();
    });

    // Verify the new package is added to the rootPackages array
    const updatedLandscape = mockOnLandscapeUpdated.mock.calls[0][0];
    const rootPackages = updatedLandscape[0].rootPackages;

    // The new root package should be in the rootPackages array
    const addedPackage = rootPackages.find((pkg) => pkg.name === 'rootpackage');
    expect(addedPackage).toBeDefined();
    expect(addedPackage?.name).toBe('rootpackage');
    expect(rootPackages.length).toBeGreaterThan(initialLandscape[0].rootPackages.length);
  });

  it('should not add a package if prompt is cancelled', async () => {
    const app = createMockApp('TestApp');
    const initialLandscape: CleanedLandscape[] = [app];

    // Mock prompt to return null (cancelled)
    mockPrompt.mockReturnValue(null);

    render(
      <LandscapeEditor
        landscape={initialLandscape}
        onLandscapeUpdated={mockOnLandscapeUpdated as (landscape: CleanedLandscape[]) => void}
        onError={mockOnError as (error: string) => void}
      />
    );

    // Find and click the "Add Root Package" button
    const addRootPackageButton = screen.getByTitle('Add Root Package');
    fireEvent.click(addRootPackageButton);

    // Wait a bit to ensure no update happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the landscape was not updated
    expect(mockOnLandscapeUpdated).not.toHaveBeenCalled();
  });

  it('should not add a package if prompt returns empty string', async () => {
    const app = createMockApp('TestApp');
    const initialLandscape: CleanedLandscape[] = [app];

    // Mock prompt to return empty string
    mockPrompt.mockReturnValue('');

    render(
      <LandscapeEditor
        landscape={initialLandscape}
        onLandscapeUpdated={mockOnLandscapeUpdated as (landscape: CleanedLandscape[]) => void}
        onError={mockOnError as (error: string) => void}
      />
    );

    // Find and click the "Add Root Package" button
    const addRootPackageButton = screen.getByTitle('Add Root Package');
    fireEvent.click(addRootPackageButton);

    // Wait a bit to ensure no update happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the landscape was not updated
    expect(mockOnLandscapeUpdated).not.toHaveBeenCalled();
  });

  it('should trim whitespace from package name when adding', async () => {
    const app = createMockApp('TestApp');
    const initialLandscape: CleanedLandscape[] = [app];

    // Mock prompt to return a package name with whitespace
    mockPrompt.mockReturnValue('  trimmedpackage  ');

    render(
      <LandscapeEditor
        landscape={initialLandscape}
        onLandscapeUpdated={mockOnLandscapeUpdated as (landscape: CleanedLandscape[]) => void}
        onError={mockOnError as (error: string) => void}
      />
    );

    // Find and click the "Add Root Package" button
    const addRootPackageButton = screen.getByTitle('Add Root Package');
    fireEvent.click(addRootPackageButton);

    // Wait for the landscape to be updated
    await waitFor(() => {
      expect(mockOnLandscapeUpdated).toHaveBeenCalled();
    });

    // Verify the package name is trimmed
    const updatedLandscape = mockOnLandscapeUpdated.mock.calls[0][0];
    const rootPackages = updatedLandscape[0].rootPackages;
    const newPackage = rootPackages.find((pkg) => pkg.name === 'trimmedpackage');
    expect(newPackage).toBeDefined();
    expect(newPackage?.name).toBe('trimmedpackage');
  });

  it('should add multiple root packages to the same application', async () => {
    const app = createMockApp('TestApp');
    const initialLandscape: CleanedLandscape[] = [app];

    const { rerender } = render(
      <LandscapeEditor
        landscape={initialLandscape}
        onLandscapeUpdated={mockOnLandscapeUpdated as (landscape: CleanedLandscape[]) => void}
        onError={mockOnError as (error: string) => void}
      />
    );

    // Get the "Add Root Package" button (app-level button)
    const addRootPackageButton = screen.getByTitle('Add Root Package');

    // Add first root package
    mockPrompt.mockReturnValueOnce('package1');
    fireEvent.click(addRootPackageButton);
    await waitFor(() => {
      expect(mockOnLandscapeUpdated).toHaveBeenCalled();
    });

    // Get the updated landscape
    const firstUpdate = mockOnLandscapeUpdated.mock.calls[0][0];
    expect(firstUpdate[0].rootPackages.length).toBeGreaterThan(initialLandscape[0].rootPackages.length);

    // Re-render with updated landscape
    rerender(
      <LandscapeEditor
        landscape={firstUpdate}
        onLandscapeUpdated={mockOnLandscapeUpdated as (landscape: CleanedLandscape[]) => void}
        onError={mockOnError as (error: string) => void}
      />
    );

    // Add second root package - get the app-level button again
    mockPrompt.mockReturnValueOnce('package2');
    const addRootPackageButton2 = screen.getByTitle('Add Root Package');
    fireEvent.click(addRootPackageButton2);

    await waitFor(() => {
      expect(mockOnLandscapeUpdated.mock.calls.length).toBeGreaterThan(1);
    });

    // Verify both packages are in the rootPackages array
    const secondUpdate = mockOnLandscapeUpdated.mock.calls[mockOnLandscapeUpdated.mock.calls.length - 1][0];
    const rootPackageNames = secondUpdate[0].rootPackages.map((pkg) => pkg.name);
    expect(rootPackageNames).toContain('package1');
    expect(rootPackageNames).toContain('package2');
  });
});
